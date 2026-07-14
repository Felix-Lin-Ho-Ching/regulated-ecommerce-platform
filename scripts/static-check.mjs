import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const mode = process.argv[2] || "smoke";
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory() && ![".git", "node_modules", ".next"].includes(name))
      walk(p);
    else if (st.isFile() && /\.(tsx|ts|css|md|json)$/.test(name))
      files.push(p.replaceAll("\\", "/"));
  }
}
walk(process.cwd());
const required = [
  "app/page.tsx",
  "app/products/page.tsx",
  "app/checkout/page.tsx",
  "app/admin/page.tsx",
  "docs/current-ux.md",
];
const missing = required.filter((p) => !files.some((f) => f.endsWith(p)));
if (missing.length) {
  console.error("Missing required files:", missing.join(", "));
  process.exit(1);
}
if (mode === "lint") {
  const bad = files
    .filter((f) => /\.(tsx|ts)$/.test(f))
    .filter((f) => readFileSync(f, "utf8").includes("TODO_BACKEND"));
  if (bad.length) {
    console.error("Unexpected backend TODO markers:", bad.join(", "));
    process.exit(1);
  }

  const clientUiBarrelImports = files
    .filter((f) => /\.(tsx|ts)$/.test(f))
    .filter((f) => {
      const text = readFileSync(f, "utf8");
      return (
        /^\s*["']use client["'];?/m.test(text) &&
        /from\s+["']@\/components\/ui["']/.test(text)
      );
    });
  if (clientUiBarrelImports.length) {
    console.error(
      [
        'Client components must not import from "@/components/ui".',
        '"@/components/ui" re-exports server-only components (AppShell, StoreHeader, and StoreFooter) that pull next/headers into the client graph.',
        "Use direct safe component imports instead:",
        ...clientUiBarrelImports,
      ].join("\n"),
    );
    process.exit(1);
  }

  const customerFacingFiles = files
    .filter((file) => /\.(tsx|ts)$/.test(file))
    .filter(
      (file) =>
        file.includes("/app/") ||
        file.includes("/components/") ||
        file.endsWith("/lib/eligibility/public-state-requirements.ts"),
    )
    .filter((file) => !file.includes("/admin/"));
  const forbiddenCustomerPhrases = [
    "CHECK STATE GUIDANCE",
    "manual review",
    "pending_admin_review",
    "pending_document_upload",
    "compliance coverage",
    "rule engine",
  ];
  const phraseHits = [];
  for (const file of customerFacingFiles) {
    const text = readFileSync(file, "utf8").toLowerCase();
    for (const phrase of forbiddenCustomerPhrases) {
      if (text.includes(phrase.toLowerCase()))
        phraseHits.push(`${file}: ${phrase}`);
    }
  }
  if (phraseHits.length) {
    console.error(
      "Forbidden customer-facing phrases found:\n" + phraseHits.join("\n"),
    );
    process.exit(1);
  }
  const stateRules = readFileSync(
    "lib/compliance/restricted-state-rules.ts",
    "utf8",
  );
  const stateListMatch = stateRules.match(
    /usStateAndDcCodes = \[([\s\S]*?)\] as const/,
  );
  const states = stateListMatch
    ? [...stateListMatch[1].matchAll(/"([A-Z]{2})"/g)].map((match) => match[1])
    : [];
  const expectedStates = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
  ];
  const missingStates = expectedStates.filter(
    (state) => !states.includes(state),
  );
  const extraStates = states.filter((state) => !expectedStates.includes(state));
  if (states.length !== 51 || missingStates.length || extraStates.length) {
    console.error(
      `Restricted state list must be exactly 50 states + DC. Found ${states.length}; missing: ${missingStates.join(",")}; extra: ${extraStates.join(",")}`,
    );
    process.exit(1);
  }
  const seedText = readFileSync("prisma/seed.ts", "utf8");
  const requiredSeedPhrases = [
    "Development rule based on Self Defense Mall stun-gun laws reference; counsel review required before production.",
    "Allowed by development stun-gun state reference; counsel review required before production.",
    "Blocked by development stun-gun state reference.",
  ];
  const missingSeedPhrases = requiredSeedPhrases.filter(
    (phrase) => !seedText.includes(phrase),
  );
  if (missingSeedPhrases.length) {
    console.error(
      "Seed is missing required stun-gun development rule text:\n" +
        missingSeedPhrases.join("\n"),
    );
    process.exit(1);
  }
  for (const state of ["DC", "HI", "MA"]) {
    if (!seedText.includes(state)) {
      console.error(
        `Seed is missing required blocked stun-gun state ${state}.`,
      );
      process.exit(1);
    }
  }

  const adminAuth = readFileSync("lib/admin/auth.ts", "utf8");
  const customerSession = readFileSync("lib/auth/session.ts", "utf8");
  const orderService = readFileSync("lib/orders/order-service.ts", "utf8");
  if (
    !adminAuth.includes(
      'process.env.NODE_ENV === "production" && !configuredSecret',
    ) ||
    !customerSession.includes(
      'process.env.NODE_ENV === "production" && !configuredSecret',
    )
  ) {
    console.error(
      "Production auth code must reject missing AUTH_SECRET before using fallback secrets.",
    );
    process.exit(1);
  }
  if (
    !adminAuth.includes(
      'process.env.NODE_ENV === "production" && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)',
    )
  ) {
    console.error(
      "Production admin fallback auth must require ADMIN_EMAIL and ADMIN_PASSWORD.",
    );
    process.exit(1);
  }
  const productionSeedBranch = seedText.match(
    /if \(process\.env\.NODE_ENV === "production"\) \{[\s\S]*?\n  \} else \{/,
  );
  if (!productionSeedBranch) {
    console.error(
      "Seed must guard local default admin passwords behind a non-production branch.",
    );
    process.exit(1);
  }
  if (
    productionSeedBranch[0].includes("linhochingfelix") ||
    productionSeedBranch[0].includes("shipping123")
  ) {
    console.error(
      "Production seed branch must not create known default admin passwords.",
    );
    process.exit(1);
  }
  if (
    orderService.includes("customerEmail: session?.email") ||
    orderService.includes("guest@stunfry.example")
  ) {
    console.error(
      "Checkout order creation must use submitted customerEmail and must not fall back to guest@stunfry.example.",
    );
    process.exit(1);
  }
  const checkoutActionsForEmail = readFileSync(
    "lib/checkout/actions.ts",
    "utf8",
  );
  for (const requiredCheckoutEmailText of [
    "customerEmail: email",
    "customerName: name",
    'shippingAddress: { name, line1, line2, city, state, postalCode, country: "US", phone }',
  ]) {
    if (!checkoutActionsForEmail.includes(requiredCheckoutEmailText)) {
      console.error(
        `Checkout submit action missing submitted customer data: ${requiredCheckoutEmailText}`,
      );
      process.exit(1);
    }
  }

  const productForm = [
    "components/admin/products/product-form.tsx",
    "components/admin/products/product-form/product-media-section.tsx",
    "components/admin/products/product-form/product-content-blocks-section.tsx",
    "components/admin/products/product-form/product-features-section.tsx",
    "components/admin/products/product-form/product-included-items-section.tsx",
    "components/admin/products/product-form/product-specifications-section.tsx",
    "components/admin/products/product-form/product-faq-section.tsx",
    "components/admin/products/product-form/product-save-controls.tsx",
  ]
    .map((productFormPath) => readFileSync(productFormPath, "utf8"))
    .join("\n");
  const validation = readFileSync("lib/products/validation.ts", "utf8");
  const gallery = readFileSync(
    "components/store/product-media-gallery.tsx",
    "utf8",
  );

  if (
    !/name=\{`mediaType\$\{index\}`}[\s\S]*?value=\{item\.type\}/.test(
      productForm,
    ) ||
    productForm.includes('type="hidden" name={`mediaType${index}`')
  ) {
    console.error(
      "Admin product form media kind select must submit name={`mediaType${index}`} directly without a duplicate hidden mediaType input.",
    );
    process.exit(1);
  }
  if (
    !validation.includes("youtubeUrlFromMediaUrl") ||
    !validation.includes(
      'youtubeSourceUrl = youtubeUrl || (youtubeUrlFromMediaUrl ? url : "")',
    ) ||
    !validation.includes(
      'if (youtubeUrl || youtubeUrlFromMediaUrl) type = "YOUTUBE"',
    )
  ) {
    console.error(
      "Product media parser must auto-detect YouTube URLs from mediaUrl as well as mediaYoutubeUrl.",
    );
    process.exit(1);
  }
  if (!gallery.includes("youtube-nocookie.com/embed")) {
    console.error(
      "Product gallery must keep rendering YouTube iframes through youtube-nocookie.com/embed.",
    );
    process.exit(1);
  }

  const homepageForm = readFileSync(
    "components/admin/storefront/homepage-media-form.tsx",
    "utf8",
  );
  const homepageActions = readFileSync(
    "lib/storefront/homepage-media-actions.ts",
    "utf8",
  );
  const homepageSlide = readFileSync(
    "components/storefront/home/hero-slide.tsx",
    "utf8",
  );
  const productService = readFileSync("lib/products/service.ts", "utf8");
  const productDetail = readFileSync(
    "components/store/product-detail.tsx",
    "utf8",
  );
  for (const forbidden of [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    ".mp4",
    ".webm",
    ".mov",
  ]) {
    if (
      homepageForm.includes(forbidden) ||
      homepageActions.includes(forbidden)
    ) {
      console.error(
        `Homepage editor must not accept video file uploads: ${forbidden}`,
      );
      process.exit(1);
    }
  }
  if (
    !homepageForm.includes('<option value="YOUTUBE">YOUTUBE</option>') ||
    homepageForm.includes('<option value="VIDEO">VIDEO</option>')
  ) {
    console.error(
      "Homepage media editor must expose IMAGE and YOUTUBE options, not VIDEO upload.",
    );
    process.exit(1);
  }
  if (
    !homepageSlide.includes(
      "youtube-nocookie.com/embed/${slide.youtubeVideoId}",
    )
  ) {
    console.error(
      "Homepage renderer must render YouTube slides with youtube-nocookie.com embeds.",
    );
    process.exit(1);
  }
  if (
    productService.includes("rows.length > 0") ||
    productService.includes("shouldReplaceCollection")
  ) {
    console.error(
      "Product update must not use rows.length > 0 as the only replace/delete condition.",
    );
    process.exit(1);
  }
  for (const marker of [
    "featuresSubmitted",
    "mediaSubmitted",
    "contentSubmitted",
    "includedSubmitted",
    "specsSubmitted",
    "faqsSubmitted",
  ]) {
    if (!validation.includes(marker) || !productService.includes(marker)) {
      console.error(`Product repeatable collection marker missing: ${marker}`);
      process.exit(1);
    }
  }
  if (
    !productForm.includes("Top product summary") ||
    !productForm.includes("State availability copy") ||
    !productForm.includes("normalProductSectionKeys")
  ) {
    console.error(
      "Product content editor must map hidden storefront sections to clear dedicated labels and normal section options.",
    );
    process.exit(1);
  }
  const exposedNormalKeys = ["features_design", "comparison", "custom_section"];
  for (const key of exposedNormalKeys) {
    if (
      !validation.includes(`"${key}"`) ||
      !productDetail.includes("product.contentSections.filter")
    ) {
      console.error(
        `Product page content renderer/static options missing normal section key: ${key}`,
      );
      process.exit(1);
    }
  }

  const productActions = readFileSync("lib/products/actions.ts", "utf8");

  const adminActionFiles = [
    "lib/product-categories/actions.ts",
    "lib/inventory/actions.ts",
    "lib/admin/notification-recipients/actions.ts",
    "lib/compliance/actions.ts",
    "lib/storefront/homepage-media-actions.ts",
    "lib/storefront-content/actions.ts",
    "lib/admin/employees-actions.ts",
    "lib/products/actions.ts",
  ];
  for (const actionFile of adminActionFiles) {
    const actionText = readFileSync(actionFile, "utf8");
    if (!/(requireAdminSession|requireOwnerOrAdmin|requireOwnerOrAdminAction|requireEmployeeManager|requireProductEditor)/.test(actionText)) {
      console.error(`Admin mutation action file lacks self-contained auth check: ${actionFile}`);
      process.exit(1);
    }
  }
  const paymentSettings = readFileSync("app/admin/payment-settings/page.tsx", "utf8");
  if (!paymentSettings.includes("Configured through environment variables, not editable here") || paymentSettings.includes("mock_ready")) {
    console.error("payment settings page must explicitly classify environment-only configuration and not use mock_ready.");
    process.exit(1);
  }
  if (existsSync("app/admin/tax-settings/page.tsx")) {
    console.error("Fake admin tax settings route must not exist; sales tax is automatic/API-driven during checkout.");
    process.exit(1);
  }
  const currentUx = readFileSync("docs/current-ux.md", "utf8");
  const requiredTaxDoc = "Sales tax is calculated automatically during checkout from the customer shipping address using the configured tax provider. There is no manual admin tax settings page.";
  if (!currentUx.includes(requiredTaxDoc)) {
    console.error("Current UX docs must state that sales tax is provider/API-driven and has no manual admin page.");
    process.exit(1);
  }
  if (!checkoutActionsForEmail.includes("calculateCheckoutTax")) {
    console.error("Checkout tax estimate action must still call calculateCheckoutTax.");
    process.exit(1);
  }
  for (const requiredOrderTaxText of ["taxCents: tax.taxCents", "taxProvider: tax.provider", "taxSnapshot: tax.snapshot"]) {
    if (!orderService.includes(requiredOrderTaxText)) {
      console.error(`Order creation must store checkout tax details: ${requiredOrderTaxText}`);
      process.exit(1);
    }
  }
  const complianceValidation = readFileSync("lib/compliance/validation.ts", "utf8");
  if (!complianceValidation.includes("isCoveredStateCode") || !complianceValidation.includes("validateZip")) {
    console.error("Compliance validation must reject invalid state codes and invalid ZIP local rules.");
    process.exit(1);
  }
  if (
    productForm.includes('label="Slug" name="slug"') &&
    productForm.includes("required")
  ) {
    console.error(
      "Admin product create form must not present slug as a normal manually required field.",
    );
    process.exit(1);
  }
  if (
    productForm.includes('label="SKU" name="sku"') &&
    productForm.includes("required")
  ) {
    console.error(
      "Admin product create form must not present SKU as a normal manually required field.",
    );
    process.exit(1);
  }
  for (const requiredAutoText of [
    "Advanced URL settings",
    "Auto-generated from product name. Edit only if you need a custom URL.",
    "Auto-generated for inventory and fulfillment. Edit only if you need a custom SKU.",
    "Regenerate slug from name",
    "Regenerate SKU",
  ]) {
    if (!productForm.includes(requiredAutoText)) {
      console.error(
        `Admin product form missing auto-generation UX text: ${requiredAutoText}`,
      );
      process.exit(1);
    }
  }
  if (
    validation.includes('missing.push("missing SKU")') ||
    validation.includes('missing.push("missing slug")')
  ) {
    console.error(
      "ProductForm validation must allow blank slug/SKU before backend generation.",
    );
    process.exit(1);
  }
  for (const requiredGenerationText of [
    "generateUniqueSku",
    "input.sku ||",
    "uniqueSlugForCreate",
    "nextSlug = input.slug || product?.slug",
    "nextSku = input.sku ||",
  ]) {
    if (!productService.includes(requiredGenerationText)) {
      console.error(
        `Product backend missing generation/preservation guard: ${requiredGenerationText}`,
      );
      process.exit(1);
    }
  }
  if (
    !productActions.includes("SKU generation failed") ||
    !productActions.includes("slug must be unique") ||
    !productActions.includes("SKU must be unique")
  ) {
    console.error(
      "Product save errors must expose friendly generated SKU and unique slug/SKU messages.",
    );
    process.exit(1);
  }

  if (
    /product\.status === "ACTIVE" \? `\/products\/\$\{product\.slug\}`/.test(productForm)
  ) {
    console.error(
      "Main admin product preview button must always use /admin/products/[id]/preview, not the public product URL.",
    );
    process.exit(1);
  }
  if (
    !productForm.includes('href={`/admin/products/${product.id}/preview`}') ||
    !productForm.includes("View live public page")
  ) {
    console.error(
      "Admin product form must keep admin preview separate from the optional live public product link.",
    );
    process.exit(1);
  }
  if (
    productActions.includes("applyInlineCategory") ||
    productActions.includes("saveProductCategory")
  ) {
    console.error(
      "Inline category creation must not happen in lib/products/actions.ts; it belongs in the product service transaction.",
    );
    process.exit(1);
  }
  if (
    !productActions.includes('redirect(`/admin/products/${input.id}?saved=1`)') &&
    !productForm.includes("router.refresh()")
  ) {
    console.error(
      "Product update must force the edit page to reload after save via redirect or router.refresh().",
    );
    process.exit(1);
  }

  const requiredProductFormText = [
    "Basic product info",
    "Pricing and inventory",
    "Compliance",
    "Product media",
    "Product page content",
    "SEO",
    "Save / publish controls",
    "mediaYoutubeUrl",
    "STUN_GUN",
  ];
  const missingProductFormText = requiredProductFormText.filter(
    (text) => !productForm.includes(text),
  );
  if (missingProductFormText.length) {
    console.error(
      "Admin product form missing grouped UX text: " +
        missingProductFormText.join(", "),
    );
    process.exit(1);
  }
  const requiredYoutubeValidationText = [
    "extractYouTubeVideoId",
    "youtu.be",
    "/watch",
    "enter a valid YouTube URL",
  ];
  const missingYoutubeValidationText = requiredYoutubeValidationText.filter(
    (text) => !validation.includes(text),
  );
  if (missingYoutubeValidationText.length) {
    console.error(
      "YouTube validation missing: " + missingYoutubeValidationText.join(", "),
    );
    process.exit(1);
  }
  const requiredGalleryText = [
    "youtube-nocookie.com/embed",
    "allowFullScreen",
    "aria-label",
    "img.youtube.com/vi",
  ];
  const missingGalleryText = requiredGalleryText.filter(
    (text) => !gallery.includes(text),
  );
  if (missingGalleryText.length) {
    console.error(
      "Product gallery missing YouTube embed behavior: " +
        missingGalleryText.join(", "),
    );
    process.exit(1);
  }
  console.log(`Static lint passed for ${files.length} files.`);
} else if (mode === "typecheck") {
  const text = files
    .filter((f) => /\.(tsx|ts)$/.test(f))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  for (const token of ["CheckoutOutcome", "StatusTone", "React.ReactNode"])
    if (!text.includes(token)) {
      console.error(`Expected type token missing: ${token}`);
      process.exit(1);
    }
  console.log(
    "Static typecheck proxy passed; TypeScript dependency unavailable in this environment.",
  );
} else {
  const routeCount = files.filter((f) => f.endsWith("page.tsx")).length;
  if (routeCount < 40) {
    console.error(`Expected at least 40 routes, found ${routeCount}`);
    process.exit(1);
  }
  const checkout = readFileSync(
    "components/checkout/one-page-checkout.tsx",
    "utf8",
  );
  const requiredCheckoutText = [
    "Card number",
    "Expiration date MM/YY",
    "Security code",
    "Name on card",
    "Use shipping address as billing address",
    "Complete checkout",
  ];
  const missingCheckoutText = requiredCheckoutText.filter(
    (text) => !checkout.includes(text),
  );
  if (missingCheckoutText.length) {
    console.error(
      "Checkout UI missing required payment text: " +
        missingCheckoutText.join(", "),
    );
    process.exit(1);
  }
  const stateConstants = readFileSync("lib/checkout/us-states.ts", "utf8");
  const checkoutActions = readFileSync("lib/checkout/actions.ts", "utf8");
  const requiredStateDropdownText = [
    "function StateSelect",
    '<select className="input mt-1" name={name}',
    '<option value="">Select state</option>',
    'name="state" value={address.state}',
    'onChange={(value) => updateAddress("state", value)}',
    'name="billingState" value={billing.state}',
    'onChange={(value) => updateBilling("state", value)}',
    "{state.code} — {state.name}",
    "Date of birth",
  ];
  const missingStateDropdownText = requiredStateDropdownText.filter(
    (text) => !checkout.includes(text),
  );
  if (missingStateDropdownText.length) {
    console.error(
      "Checkout UI missing required state dropdown behavior: " +
        missingStateDropdownText.join(", "),
    );
    process.exit(1);
  }
  for (const forbidden of [
    'name="state" maxLength={2}',
    'name="billingState" maxLength={2}',
  ]) {
    if (checkout.includes(forbidden)) {
      console.error(`Checkout state field is still free text: ${forbidden}`);
      process.exit(1);
    }
  }
  const requiredStateConstants = [
    '{ code: "TX", name: "Texas" }',
    '{ code: "HI", name: "Hawaii" }',
    '{ code: "MA", name: "Massachusetts" }',
    '{ code: "DC", name: "District of Columbia" }',
    "export function isValidUsStateCode",
    "export function normalizeUsStateCode",
  ];
  const missingStateConstants = requiredStateConstants.filter(
    (text) => !stateConstants.includes(text),
  );
  if (missingStateConstants.length) {
    console.error(
      "US state constants missing required checkout state coverage: " +
        missingStateConstants.join(", "),
    );
    process.exit(1);
  }
  const requiredBackendStateValidation = [
    'normalizeUsStateCode(required(formData, "state"))',
    "!isValidUsStateCode(state)",
    'redirect("/checkout?error=address")',
    'normalizeUsStateCode(required(formData, "billingState"))',
    "!isValidUsStateCode(billingState)",
  ];
  const missingBackendStateValidation = requiredBackendStateValidation.filter(
    (text) => !checkoutActions.includes(text),
  );
  if (missingBackendStateValidation.length) {
    console.error(
      "Checkout backend missing required invalid state rejection: " +
        missingBackendStateValidation.join(", "),
    );
    process.exit(1);
  }
  for (const forbidden of [
    "AgeChecker",
    "Sezzle",
    "Buy Now Pay Later",
    "I confirm I am at least 18 years old",
    "ageAttestation",
  ]) {
    if (checkout.includes(forbidden)) {
      console.error(`Checkout UI contains forbidden text: ${forbidden}`);
      process.exit(1);
    }
  }
  console.log(`Smoke check passed with ${routeCount} page routes.`);
}
if (mode === "lint") {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!pkg.dependencies?.resend) { console.error("Missing resend dependency."); process.exit(1); }
  if (process.env.EMAIL_MODE === "live" && !process.env.RESEND_API_KEY) { console.error("RESEND_API_KEY is required when EMAIL_MODE=live."); process.exit(1); }
  if (process.env.EMAIL_MODE === "live" && !process.env.EMAIL_FROM) { console.error("EMAIL_FROM is required when EMAIL_MODE=live."); process.exit(1); }
  if (existsSync(".env.example")) {
    const envExample = readFileSync(".env.example", "utf8");
    if (/re_[A-Za-z0-9]{20,}|sk_(live|test)_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(envExample)) { console.error(".env.example contains real-looking secrets."); process.exit(1); }
  }
  const ship = readFileSync("lib/fulfillment/ship-orders.ts", "utf8");
  if (ship.includes("logDebugEmail({ type: \"CUSTOMER_SHIPMENT\"")) { console.error("Shipment confirmation still calls debug-only email provider directly."); process.exit(1); }
}
