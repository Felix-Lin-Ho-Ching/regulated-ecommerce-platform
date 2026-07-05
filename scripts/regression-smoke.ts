import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { getCatalogProductBySlug, getCatalogProducts } from "../lib/db/catalog";
import { processOrderPayment } from "../lib/payments/payment-service";
import { releaseOrderAfterPaymentApproval } from "../lib/orders/order-service";
import { getFulfillmentOrdersForAdmin } from "../lib/fulfillment/admin-queries";
import { shipSingleOrder } from "../lib/fulfillment/ship-orders";
import {
  createProduct,
  inlineCategoryDuplicateMessage,
  updateProduct,
} from "../lib/products/service";
import { getAdminProductById } from "../lib/products/service";
import { getAdminOrder } from "../lib/admin/orders/service";
import { logDebugEmail } from "../lib/email/email-log-service";
import { buildAdminNewOrderEmail } from "../lib/email/templates/admin-new-order";
import { buildOrderConfirmationEmail } from "../lib/email/templates/order-confirmation";
import {
  parseProductForm,
  ProductFormValidationError,
  type ProductFormInput,
} from "../lib/products/validation";
import {
  deleteHomepageSlide,
  getHomepageSlides,
  upsertHomepageSlide,
} from "../lib/storefront/homepage-slides";
import type { AdminSession } from "../lib/admin/auth";
import { calculateCheckoutTax } from "../lib/tax/tax-service";
import type { TaxProvider } from "../lib/tax/types";

const prisma = new PrismaClient();
const run = `regression-${Date.now()}`;
const slug = `${run}-draft-device`;
const sku = `REG-${Date.now()}`;
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const orders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: "REG-" } },
    select: { id: true },
  });
  const orderIds = orders.map((o: { id: string }) => o.id);
  const orderItemIds = orderIds.length
    ? (
        await prisma.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { id: true },
        })
      ).map((i: { id: string }) => i.id)
    : [];
  if (orderIds.length) {
    await prisma.emailLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.fulfillmentToken.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.inventoryReservation.deleteMany({
      where: { orderItemId: { in: orderItemIds } },
    });
    await prisma.paymentAttempt.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.shippingAddress.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.auditLog.deleteMany({
      where: { entityType: "Order", entityId: { in: orderIds } },
    });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: "regression-" } },
    include: { variants: true },
  });
  const productIds = products.map((p: { id: string }) => p.id);
  const variantIds = products.flatMap(
    (p: { variants: Array<{ id: string }> }) =>
      p.variants.map((v: { id: string }) => v.id),
  );
  if (variantIds.length) {
    const invIds = (
      await prisma.inventory.findMany({
        where: { variantId: { in: variantIds } },
        select: { id: true },
      })
    ).map((i: { id: string }) => i.id);
    await prisma.inventoryReservation.deleteMany({
      where: { inventoryId: { in: invIds } },
    });
    await prisma.inventoryTransaction.deleteMany({
      where: { inventoryId: { in: invIds } },
    });
    await prisma.inventory.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    await prisma.productVariant.deleteMany({
      where: { id: { in: variantIds } },
    });
  }
  if (productIds.length) {
    await prisma.productFeature.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.productMedia.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.productContentSection.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.productIncludedItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.productSpec.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.productFAQ.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  }
  await prisma.productCategory.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "regression-inline-" } },
        { slug: { startsWith: "regression-basic-" } },
      ],
    },
  });
  await prisma.homepageMedia.deleteMany({
    where: { title: { startsWith: "Regression" } },
  });
  await prisma.adminUser.deleteMany({
    where: { email: { endsWith: "@regression.local" } },
  });
}

async function assertParsedYouTubeMedia(
  label: string,
  fields: Record<string, string>,
  expectedUrl: string,
  expectedId = "dQw4w9WgXcQ",
) {
  const formData = new FormData();
  formData.set("name", `Regression Parser ${label}`);
  formData.set(
    "slug",
    `regression-parser-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  );
  formData.set("sku", `REG-PARSER-${label}`);
  formData.set("categoryId", "parser-category");
  formData.set("price", "49.99");
  formData.set("restricted", "on");
  formData.set("restrictedClass", "STUN_GUN");
  formData.set("status", "DRAFT");
  formData.set("mediaSortOrder0", "0");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  const parsed = await parseProductForm(formData);
  assert(
    parsed.media.length === 1,
    `${label} parser did not return one media row.`,
  );
  assert(
    parsed.media[0].type === "YOUTUBE",
    `${label} parser did not save YouTube media type.`,
  );
  assert(
    parsed.media[0].url === expectedUrl,
    `${label} parser did not preserve the original YouTube URL.`,
  );
  assert(
    parsed.media[0].youtubeVideoId === expectedId,
    `${label} parser did not extract YouTube video ID.`,
  );
}

async function assertCheckoutTaxRegression() {
  assert(
    !existsSync("app/admin/tax-settings/page.tsx"),
    "Fake admin tax settings page still exists.",
  );

  let capturedInput: any;
  const provider: TaxProvider = {
    async calculateTax(input) {
      capturedInput = input;
      return {
        taxCents: input.toAddress.state === "WA" ? 912 : 0,
        provider: "regression-provider",
        snapshot: { destination: input.toAddress, lineItems: input.lineItems },
      };
    },
  };

  const result = await calculateCheckoutTax(
    {
      toAddress: {
        name: "Regression Buyer",
        line1: "100 Pike St",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US",
      },
      shippingCents: 1299,
      lineItems: [
        {
          id: "variant-regression",
          productId: "product-regression",
          sku: "REG-TAX",
          name: "Regression Taxed Item",
          quantity: 2,
          unitPriceCents: 4999,
          productTaxCode: "31000",
          categoryTaxCode: "30070",
        },
      ],
    },
    provider,
  );

  assert(result.taxCents === 912, "Provider tax result was not returned.");
  assert(
    capturedInput?.toAddress?.state === "WA" &&
      capturedInput.toAddress.line1 === "100 Pike St" &&
      capturedInput.toAddress.postalCode === "98101",
    "Checkout tax did not use the shipping state/address input.",
  );
  assert(
    capturedInput.lineItems[0]?.productTaxCode === "31000" &&
      capturedInput.lineItems[0]?.categoryTaxCode === "30070" &&
      capturedInput.lineItems[0]?.quantity === 2,
    "Checkout tax did not pass cart line item tax metadata.",
  );

  const disabled = await calculateCheckoutTax(
    {
      toAddress: {
        line1: "1 Main",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "US",
      },
      shippingCents: 0,
      lineItems: [
        {
          id: "variant-disabled",
          name: "Disabled Tax Item",
          quantity: 1,
          unitPriceCents: 2500,
        },
      ],
    },
    null,
  );
  assert(
    disabled.taxCents === 0 && disabled.provider === "disabled",
    "Disabled tax mode did not return zero tax.",
  );
}

async function assertInvalidYouTubeFails() {
  const invalidUrl = "https://www.youtube.com/watch?v=not-valid";
  try {
    await assertParsedYouTubeMedia(
      "invalid-youtube",
      { mediaType0: "YOUTUBE", mediaYoutubeUrl0: invalidUrl },
      invalidUrl,
      "not-valid",
    );
  } catch (error) {
    assert(
      error instanceof ProductFormValidationError &&
        error.message === "Media row 1: enter a valid YouTube URL.",
      "Invalid YouTube URL did not fail with the expected validation error.",
    );
    return;
  }
  throw new Error("Invalid YouTube URL unexpectedly parsed successfully.");
}

async function productInput(
  categoryId: string,
  overrides: Partial<ProductFormInput> = {},
): Promise<ProductFormInput> {
  return {
    name: "Regression Draft Device",
    slug,
    brand: "Stun Fry",
    categoryId,
    restrictedClass: "STUN_GUN",
    description: "Regression product",
    status: "DRAFT",
    restricted: true,
    sku,
    priceCents: 4999,
    stockQuantity: 5,
    lowStockThreshold: 1,
    auditNote: "regression",
    features: [
      {
        code: "safe",
        label: "Safety",
        value: "Preserved",
        restrictedRelevant: true,
      },
    ],
    media: [],
    contentSections: [
      {
        sectionKey: "overview",
        title: "Overview",
        body: "Preserved section",
        sortOrder: 0,
      },
    ],
    includedItems: [{ label: "Cable", quantity: 1, sortOrder: 0 }],
    specs: [{ label: "Battery", value: "Rechargeable", sortOrder: 0 }],
    faqs: [{ question: "Works?", answer: "Yes", sortOrder: 0 }],
    ...overrides,
  };
}


async function assertInlineCategoryRegression(existingCategoryId: string) {
  const invalidForm = new FormData();
  invalidForm.set("intent", "draft");
  invalidForm.set("name", "Regression Invalid Inline Category");
  invalidForm.set("price", "0");
  invalidForm.set("newCategoryName", "Regression Inline Invalid");
  try {
    await parseProductForm(invalidForm);
    throw new Error("Invalid inline category product unexpectedly parsed.");
  } catch (error) {
    assert(
      error instanceof ProductFormValidationError &&
        error.message.includes("missing price"),
      "Invalid product form with inline category did not fail product validation.",
    );
  }
  assert(
    !(await prisma.productCategory.findFirst({
      where: { slug: "regression-inline-invalid" },
    })),
    "Invalid product form created an orphan inline category.",
  );

  const duplicateForm = new FormData();
  duplicateForm.set("intent", "draft");
  duplicateForm.set("name", "Regression Duplicate Inline Category Product");
  duplicateForm.set("price", "19.99");
  duplicateForm.set("newCategoryName", "Stun Guns");
  const duplicateParsed = await parseProductForm(duplicateForm);
  try {
    await createProduct({
      ...duplicateParsed,
      slug: "regression-inline-duplicate-product",
      sku: `REG-INLINE-DUP-${Date.now()}`,
    });
    throw new Error("Duplicate inline category unexpectedly created product.");
  } catch (error) {
    assert(
      error instanceof Error && error.message === inlineCategoryDuplicateMessage,
      "Duplicate inline category did not return the friendly duplicate message.",
    );
  }
  assert(
    !(await prisma.product.findUnique({
      where: { slug: "regression-inline-duplicate-product" },
    })),
    "Duplicate inline category failure still saved a product.",
  );

  const validForm = new FormData();
  const categoryName = `Regression Inline Valid ${Date.now()}`;
  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  validForm.set("intent", "draft");
  validForm.set("name", "Regression Inline Valid Product");
  validForm.set("slug", "regression-inline-valid-product");
  validForm.set("sku", `REG-INLINE-${Date.now()}`);
  validForm.set("price", "29.99");
  validForm.set("newCategoryName", categoryName);
  const validParsed = await parseProductForm(validForm);
  const productId = await createProduct(validParsed);
  const createdCategory = await prisma.productCategory.findUniqueOrThrow({
    where: { slug: categorySlug },
  });
  const createdProduct = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  assert(
    createdProduct.categoryId === createdCategory.id,
    "Inline category create did not assign product.categoryId atomically.",
  );
  const editProduct = await getAdminProductById(productId);
  assert(
    editProduct?.categoryId === createdCategory.id,
    "Reloading the edit page data did not select the inline category.",
  );
  assert(
    editProduct?.restrictedClass === null,
    "Inline category handling was incorrectly coupled to restrictedClass.",
  );

  await updateProduct(
    await productInput(existingCategoryId, {
      id: productId,
      name: "Regression Inline Valid Product Updated",
      slug: createdProduct.slug,
      sku: validParsed.sku,
      categoryId: createdCategory.id,
      restricted: false,
      restrictedClass: undefined,
    }),
  );
}


async function assertBasicProductInfoPersistence(categoryId: string) {
  const alternateCategory = await prisma.productCategory.upsert({
    where: { slug: "regression-basic-alt" },
    update: {},
    create: { slug: "regression-basic-alt", name: "Regression Basic Alt" },
  });

  const createdId = await createProduct(
    await productInput(categoryId, {
      name: "Regression Basic Original",
      slug: `regression-basic-${Date.now()}`,
      sku: `REG-BASIC-${Date.now()}`,
      status: "DRAFT",
      priceCents: 2599,
    }),
  );
  let saved = await prisma.product.findUniqueOrThrow({ where: { id: createdId } });
  assert(
    saved.name === "Regression Basic Original",
    "Created product name did not equal the submitted name.",
  );
  assert(
    saved.categoryId === categoryId,
    "Created product categoryId did not equal the selected category.",
  );
  let reloaded = await getAdminProductById(createdId);
  assert(
    reloaded?.name === "Regression Basic Original" &&
      reloaded.categoryId === categoryId,
    "Reloaded admin product did not reflect created name/categoryId.",
  );

  await updateProduct(
    await productInput(alternateCategory.id, {
      id: createdId,
      name: "Regression Basic Updated",
      slug: saved.slug,
      sku: `REG-BASIC-${createdId.slice(0, 8)}`,
      status: "DRAFT",
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({ where: { id: createdId } });
  reloaded = await getAdminProductById(createdId);
  assert(
    saved.name === "Regression Basic Updated" &&
      saved.categoryId === alternateCategory.id,
    "Updated product name/categoryId did not persist in the database.",
  );
  assert(
    reloaded?.name === "Regression Basic Updated" &&
      reloaded.categoryId === alternateCategory.id,
    "Reloaded admin product did not reflect updated name/categoryId.",
  );

  await updateProduct(
    await productInput(alternateCategory.id, {
      id: createdId,
      name: "Regression Basic Continue Editing",
      slug: saved.slug,
      sku: `REG-BASIC-${createdId.slice(0, 8)}`,
      status: "DRAFT",
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({ where: { id: createdId } });
  assert(
    saved.categoryId === alternateCategory.id,
    "Save and continue editing cleared categoryId.",
  );

  await updateProduct(
    await productInput(alternateCategory.id, {
      id: createdId,
      name: "Regression Basic Published",
      slug: saved.slug,
      sku: `REG-BASIC-${createdId.slice(0, 8)}`,
      status: "ACTIVE",
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({ where: { id: createdId } });
  assert(
    saved.status === "ACTIVE" && saved.categoryId === alternateCategory.id,
    "Publish cleared categoryId.",
  );
}

async function assertPreviewRegression(categoryId: string) {
  const productFormSource = await import("node:fs/promises").then((fs) =>
    fs.readFile("components/admin/products/product-form.tsx", "utf8"),
  );
  assert(
    productFormSource.includes('href={`/admin/products/${product.id}/preview`}'),
    "Product form draft preview link does not point to the admin preview route.",
  );
  assert(
    productFormSource.includes("View live public page"),
    "Product form does not expose the active-only live public page link.",
  );
  assert(
    !productFormSource.includes('product.status === "ACTIVE" ? `/products/${product.slug}`'),
    "Product form main preview link still switches active products to the public URL.",
  );

  const draftId = await createProduct(
    await productInput(categoryId, {
      name: "Regression Preview Draft",
      slug: `regression-preview-draft-${Date.now()}`,
      sku: `REG-PREVIEW-${Date.now()}`,
      status: "DRAFT",
    }),
  );
  const draft = await getAdminProductById(draftId);
  assert(draft?.status === "DRAFT", "Admin preview test draft product was not loadable by id.");
  assert(
    !(await getCatalogProductBySlug(draft.slug)),
    "Draft public /products/[slug] route data remained available.",
  );
}

async function makeOrder(
  product: any,
  variant: any,
  mode: string,
  state = "TX",
) {
  return prisma.order.create({
    data: {
      orderNumber: `REG-${mode}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: "PENDING_PAYMENT",
      fulfillmentStatus: "FULFILLMENT_HOLD",
      subtotalCents: 4999,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 4999,
      customerEmail:
        mode === "approved" ? "buyer123@example.com" : "buyer@regression.local",
      customerName: "Regression Buyer",
      liveCheckoutEnabled: false,
      liveFulfillmentEnabled: false,
      paymentMode: mode,
      eligibilityResult: state === "TX" ? "AUTO_ELIGIBLE" : "BLOCKED",
      shippingAddress: {
        create: {
          name: "Regression Buyer",
          line1: "1 Main",
          city: "Austin",
          state,
          postalCode: state === "TX" ? "78701" : "96801",
          normalized: true,
          deliverable: true,
        },
      },
      items: {
        create: {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          sku,
          quantity: 1,
          unitPriceCents: 4999,
        },
      },
    },
    include: { items: true, shippingAddress: true },
  });
}

async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required for regression smoke tests.");
  await cleanup();

  await assertCheckoutTaxRegression();

  await assertParsedYouTubeMedia(
    "youtube-field",
    {
      mediaType0: "YOUTUBE",
      mediaYoutubeUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  await assertParsedYouTubeMedia(
    "youtube-media-url",
    {
      mediaType0: "YOUTUBE",
      mediaUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  await assertParsedYouTubeMedia(
    "image-autocorrect",
    {
      mediaType0: "IMAGE",
      mediaUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  await assertParsedYouTubeMedia(
    "youtu-be",
    { mediaType0: "YOUTUBE", mediaUrl0: "https://youtu.be/dQw4w9WgXcQ" },
    "https://youtu.be/dQw4w9WgXcQ",
  );
  await assertParsedYouTubeMedia(
    "watch-url",
    {
      mediaType0: "YOUTUBE",
      mediaUrl0: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    },
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
  );
  await assertParsedYouTubeMedia(
    "nocookie-embed",
    {
      mediaType0: "YOUTUBE",
      mediaUrl0: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    },
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  await assertInvalidYouTubeFails();
  const category = await prisma.productCategory.upsert({
    where: { slug: "stun-guns" },
    update: {},
    create: { slug: "stun-guns", name: "Stun Guns" },
  });

  const minimalForm = new FormData();
  minimalForm.set("name", "Regression Auto Generated Device");
  minimalForm.set("categoryId", category.id);
  minimalForm.set("price", "39.99");
  minimalForm.set("intent", "draft");
  const parsedMinimal = await parseProductForm(minimalForm);
  assert(
    parsedMinimal.slug === "regression-auto-generated-device" &&
      parsedMinimal.sku === "" &&
      parsedMinimal.status === "DRAFT",
    "Product form did not allow name/category/price-only draft with generated slug and blank SKU.",
  );
  const autoId = await createProduct(parsedMinimal);
  const autoSaved = await prisma.product.findUniqueOrThrow({
    where: { id: autoId },
    include: { variants: { include: { inventory: true } } },
  });
  assert(
    autoSaved.slug === "regression-auto-generated-device" &&
      autoSaved.variants[0]?.sku &&
      autoSaved.variants[0].sku !== "",
    "Blank slug/SKU create did not generate persisted identifiers.",
  );
  assert(
    autoSaved.status === "DRAFT",
    "Minimum viable product create did not save as Draft.",
  );
  assert(
    autoSaved.variants[0]?.inventory?.onHand === 0,
    "Generated SKU did not create inventory for fulfillment.",
  );

  const duplicateSkuId = await createProduct(
    await productInput(category.id, {
      name: "Regression Duplicate SKU Device",
      slug: "",
      sku: "",
    }),
  );
  const duplicateSkuProduct = await prisma.product.findUniqueOrThrow({
    where: { id: duplicateSkuId },
    include: { variants: true },
  });
  assert(
    duplicateSkuProduct.slug === "regression-duplicate-sku-device" &&
      duplicateSkuProduct.variants[0]?.sku !== autoSaved.variants[0]?.sku,
    "Duplicate blank SKU generation did not create a unique SKU.",
  );

  const manualId = await createProduct(
    await productInput(category.id, {
      name: "Regression Manual Overrides",
      slug: "regression-custom-url",
      sku: "REG-MANUAL-001",
    }),
  );
  let manualSaved = await prisma.product.findUniqueOrThrow({
    where: { id: manualId },
    include: { variants: true },
  });
  assert(
    manualSaved.slug === "regression-custom-url" &&
      manualSaved.variants[0]?.sku === "REG-MANUAL-001",
    "Manual slug/SKU override did not persist on create.",
  );
  await updateProduct(
    await productInput(category.id, {
      id: manualId,
      name: "Regression Manual Renamed",
      slug: manualSaved.slug,
      sku: manualSaved.variants[0].sku,
    }),
  );
  manualSaved = await prisma.product.findUniqueOrThrow({
    where: { id: manualId },
    include: { variants: true },
  });
  assert(
    manualSaved.slug === "regression-custom-url" &&
      manualSaved.variants[0]?.sku === "REG-MANUAL-001",
    "Editing product name silently overwrote existing slug/SKU.",
  );

  for (const [label, fields, expected] of [
    [
      "missing category",
      { name: "Regression Missing Category", price: "12.00" },
      "missing category",
    ],
    [
      "missing price",
      { name: "Regression Missing Price", categoryId: category.id },
      "missing price",
    ],
  ] as const) {
    const invalid = new FormData();
    invalid.set("intent", "draft");
    for (const [key, value] of Object.entries(fields)) invalid.set(key, value);
    try {
      await parseProductForm(invalid);
      throw new Error(`${label} unexpectedly parsed.`);
    } catch (error) {
      assert(
        error instanceof ProductFormValidationError &&
          error.message.includes(expected),
        `${label} did not block save with exact missing field.`,
      );
    }
  }

  await assertInlineCategoryRegression(category.id);
  await assertBasicProductInfoPersistence(category.id);
  await assertPreviewRegression(category.id);

  const id = await createProduct(await productInput(category.id));
  assert(
    !(await getCatalogProducts()).some((p) => p.id === id),
    "Draft product appeared on storefront.",
  );
  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ACTIVE",
      mediaSubmitted: true,
      media: [
        {
          type: "IMAGE",
          url: "/uploads/regression.jpg",
          alt: "Regression image",
          title: "Image",
          sortOrder: 0,
        },
        {
          type: "YOUTUBE",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          youtubeVideoId: "dQw4w9WgXcQ",
          title: "Video",
          sortOrder: 1,
        },
      ],
    }),
  );
  let saved = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      contentSections: true,
      includedItems: true,
      specs: true,
      faqs: true,
      features: true,
      variants: { include: { inventory: true } },
    },
  });
  assert(
    saved.status === "ACTIVE" &&
      saved.media.length === 2 &&
      saved.media[1].type === "YOUTUBE" &&
      saved.media[1].youtubeVideoId === "dQw4w9WgXcQ",
    "Active product media did not persist/reload.",
  );
  assert(
    (await getCatalogProducts()).some(
      (p) =>
        p.id === id &&
        p.media.some((m) => m.type === "YOUTUBE" && m.youtubeVideoId),
    ),
    "Active product with media did not render in storefront catalog data.",
  );
  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ACTIVE",
      name: "Regression Renamed",
      media: saved.media.map((m: any) => ({
        type: m.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE",
        url: m.url,
        thumbnailUrl: m.thumbnailUrl ?? undefined,
        youtubeVideoId: m.youtubeVideoId ?? undefined,
        alt: m.alt ?? undefined,
        title: m.title ?? undefined,
        sortOrder: m.sortOrder,
      })),
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      media: true,
      contentSections: true,
      includedItems: true,
      specs: true,
      faqs: true,
      features: true,
      variants: { include: { inventory: true } },
    },
  });
  assert(
    saved.media.length === 2 &&
      saved.contentSections.length === 1 &&
      saved.includedItems.length === 1 &&
      saved.specs.length === 1 &&
      saved.faqs.length === 1 &&
      saved.features.length === 1,
    "Unrelated product save wiped media or repeatable content.",
  );
  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ARCHIVED",
      auditNote: "archive regression",
      media: saved.media.map((m: any) => ({
        type: m.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE",
        url: m.url,
        youtubeVideoId: m.youtubeVideoId ?? undefined,
        sortOrder: m.sortOrder,
      })),
    }),
  );
  assert(
    !(await getCatalogProducts()).some((p) => p.id === id),
    "Archived product appeared on storefront.",
  );
  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ACTIVE",
      name: "Regression Empty Collection Guard",
      features: [],
      media: [],
      contentSections: [],
      includedItems: [],
      specs: [],
      faqs: [],
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      media: true,
      contentSections: true,
      includedItems: true,
      specs: true,
      faqs: true,
      features: true,
      variants: { include: { inventory: true } },
    },
  });
  assert(
    saved.media.length === 2 &&
      saved.contentSections.length === 1 &&
      saved.includedItems.length === 1 &&
      saved.specs.length === 1 &&
      saved.faqs.length === 1 &&
      saved.features.length === 1,
    "Empty unrelated product save wiped existing media or repeatable content.",
  );

  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ACTIVE",
      featuresSubmitted: true,
      contentSubmitted: true,
      includedSubmitted: true,
      specsSubmitted: true,
      faqsSubmitted: true,
      features: [
        {
          code: "updated",
          label: "Updated",
          value: "Feature",
          restrictedRelevant: false,
        },
      ],
      contentSections: [
        {
          sectionKey: "features_design",
          title: "Updated page block",
          body: "Visible storefront content",
          sortOrder: 0,
        },
        {
          sectionKey: "state_requirements",
          title: "State availability copy",
          body: "Updated state copy",
          sortOrder: 1,
        },
        {
          sectionKey: "overview",
          title: "Top product summary",
          body: "Updated overview",
          sortOrder: 2,
        },
      ],
      includedItems: [{ label: "Updated cable", quantity: 2, sortOrder: 0 }],
      specs: [{ label: "Updated battery", value: "USB-C", sortOrder: 0 }],
      faqs: [{ question: "Updated?", answer: "Yes", sortOrder: 0 }],
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      contentSections: { orderBy: { sortOrder: "asc" } },
      includedItems: true,
      specs: true,
      faqs: true,
      features: true,
      media: true,
      variants: { include: { inventory: true } },
    },
  });
  assert(
    saved.features[0]?.code === "updated" &&
      saved.includedItems[0]?.label === "Updated cable" &&
      saved.specs[0]?.value === "USB-C" &&
      saved.faqs[0]?.question === "Updated?",
    "Product repeatable content update did not persist.",
  );
  const catalogProduct = (await getCatalogProducts()).find((p) => p.id === id);
  assert(
    catalogProduct?.contentSections.some(
      (section) =>
        section.sectionKey === "features_design" &&
        section.body === "Visible storefront content",
    ),
    "Normal product content section was not visible in storefront catalog data.",
  );
  assert(
    catalogProduct?.contentSections.some(
      (section) =>
        section.sectionKey === "overview" &&
        section.body === "Updated overview",
    ) &&
      catalogProduct?.contentSections.some(
        (section) =>
          section.sectionKey === "state_requirements" &&
          section.body === "Updated state copy",
      ),
    "Overview/state availability copy mapping did not persist for storefront rendering.",
  );
  await updateProduct(
    await productInput(category.id, {
      id,
      status: "ACTIVE",
      featuresSubmitted: true,
      contentSubmitted: true,
      includedSubmitted: true,
      specsSubmitted: true,
      faqsSubmitted: true,
      features: [],
      contentSections: [],
      includedItems: [],
      specs: [],
      faqs: [],
    }),
  );
  saved = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      media: true,
      contentSections: true,
      includedItems: true,
      specs: true,
      faqs: true,
      features: true,
      variants: { include: { inventory: true } },
    },
  });
  assert(
    saved.contentSections.length === 0 &&
      saved.includedItems.length === 0 &&
      saved.specs.length === 0 &&
      saved.faqs.length === 0 &&
      saved.features.length === 0,
    "Submitted empty repeatable collections did not delete final rows from DB.",
  );

  const imageSlideId = await upsertHomepageSlide({
    id: "new",
    slot: "hero-slide",
    type: "IMAGE",
    url: "/uploads/regression-home.jpg",
    thumbnailUrl: "/uploads/regression-home-thumb.jpg",
    headline: "Regression image slide",
    subheadline: "",
    ctaLabel: "Shop products",
    ctaHref: "/products",
    badge1: "",
    badge2: "",
    badge3: "",
    enabled: true,
    sortOrder: 98,
  });
  let homeSlides = await getHomepageSlides();
  assert(
    homeSlides.some(
      (slide) => slide.id === imageSlideId && slide.type === "IMAGE",
    ),
    "Homepage image slide create did not persist to storefront data.",
  );
  await upsertHomepageSlide({
    id: imageSlideId,
    slot: "hero-slide",
    type: "IMAGE",
    url: "/uploads/regression-home-updated.jpg",
    thumbnailUrl: "/uploads/regression-home-thumb.jpg",
    headline: "Regression image slide updated",
    subheadline: "",
    ctaLabel: "Shop products",
    ctaHref: "/products",
    badge1: "",
    badge2: "",
    badge3: "",
    enabled: true,
    sortOrder: 98,
  });
  homeSlides = await getHomepageSlides();
  assert(
    homeSlides.some(
      (slide) =>
        slide.id === imageSlideId &&
        slide.url === "/uploads/regression-home-updated.jpg",
    ),
    "Homepage image slide update did not persist.",
  );
  await deleteHomepageSlide(imageSlideId);
  assert(
    !(await getHomepageSlides()).some((slide) => slide.id === imageSlideId),
    "Homepage image slide delete/delete-final did not persist.",
  );
  const youtubeSlideId = await upsertHomepageSlide({
    id: "new",
    slot: "hero-slide",
    type: "YOUTUBE",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeVideoId: "dQw4w9WgXcQ",
    thumbnailUrl: "/uploads/regression-youtube-thumb.jpg",
    headline: "Regression YouTube slide",
    subheadline: "",
    ctaLabel: "Shop products",
    ctaHref: "/products",
    badge1: "",
    badge2: "",
    badge3: "",
    enabled: true,
    sortOrder: 99,
  });
  homeSlides = await getHomepageSlides();
  assert(
    homeSlides.some(
      (slide) =>
        slide.id === youtubeSlideId &&
        slide.type === "YOUTUBE" &&
        slide.youtubeVideoId === "dQw4w9WgXcQ",
    ),
    "Homepage YouTube slide create did not persist to storefront data.",
  );
  await deleteHomepageSlide(youtubeSlideId);
  assert(
    !(await getHomepageSlides()).some((slide) => slide.id === youtubeSlideId),
    "Homepage YouTube slide delete/delete-final did not persist.",
  );

  const role = await prisma.adminRole.upsert({
    where: { code: "FULFILLMENT" },
    update: {},
    create: { code: "FULFILLMENT", name: "Fulfillment" },
  });
  const admin = await prisma.adminUser.create({
    data: {
      email: `${run}@regression.local`,
      name: "Regression Fulfillment",
      passwordHash: "x",
      roleId: role.id,
    },
  });
  const actor: AdminSession = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: "FULFILLMENT",
    demo: false,
  };
  const variant = saved.variants[0];
  const approved = await makeOrder(saved, variant, "approved");
  assert(
    approved.customerEmail === "buyer123@example.com",
    "Guest checkout/order creation did not store buyer123@example.com.",
  );
  const approvedPayment = await processOrderPayment(
    prisma,
    approved,
    "mock_card",
    {
      cardNumber: "4111111111111111",
      expiration: "12/30",
      cvv: "123",
      nameOnCard: "Regression Buyer",
      postalCode: "78701",
    },
  );
  assert(
    approvedPayment.paymentAttempt.status === "APPROVED" &&
      !JSON.stringify(approvedPayment.paymentAttempt).includes(
        "4111111111111111",
      ) &&
      !JSON.stringify(approvedPayment.paymentAttempt).includes("123"),
    "Approved payment failed or stored raw card data.",
  );
  await releaseOrderAfterPaymentApproval(approved.id, {
    email: "regression",
    role: "SYSTEM",
  });
  const paid = await prisma.order.findUniqueOrThrow({
    where: { id: approved.id },
    include: { paymentAttempts: true, shippingAddress: true },
  });
  assert(
    paid.status === "PAID" &&
      paid.fulfillmentStatus === "READY_TO_SHIP" &&
      paid.paymentAttempts.some(
        (p: { status: string }) => p.status === "APPROVED",
      ),
    "Approved order/payment state is inconsistent.",
  );
  const confirmation = buildOrderConfirmationEmail({
    orderNumber: paid.orderNumber,
    createdAt: paid.createdAt,
    items: approved.items,
    totalCents: paid.totalCents,
    shippingAddress: paid.shippingAddress!,
    hasRestrictedItems: true,
  });
  const adminEmail = buildAdminNewOrderEmail({
    orderNumber: paid.orderNumber,
    customerEmail: paid.customerEmail,
    totalCents: paid.totalCents,
    hasRestrictedItems: true,
    shippingState: paid.shippingAddress?.state,
    shippingPostalCode: paid.shippingAddress?.postalCode,
    adminOrderUrl: `/admin/orders/${paid.orderNumber}`,
  });
  await logDebugEmail({
    type: "ORDER_REQUEST_CONFIRMATION",
    to: paid.customerEmail!,
    subject: confirmation.subject,
    text: confirmation.text,
    orderId: paid.id,
    metadata: { orderNumber: paid.orderNumber },
  });
  await logDebugEmail({
    type: "ADMIN_NEW_ORDER",
    to: "admin@regression.local",
    subject: adminEmail.subject,
    text: adminEmail.text,
    orderId: paid.id,
    metadata: { orderNumber: paid.orderNumber },
  });
  const emailLogs = await prisma.emailLog.findMany({
    where: { orderId: paid.id },
  });
  assert(
    emailLogs.some(
      (log: any) =>
        log.type === "ORDER_REQUEST_CONFIRMATION" &&
        log.to === "buyer123@example.com",
    ),
    "Confirmation email log target was not buyer123@example.com.",
  );
  assert(
    emailLogs.some(
      (log: any) =>
        log.type === "ADMIN_NEW_ORDER" &&
        (log.text ?? "").includes("buyer123@example.com"),
    ),
    "Admin new order email did not include buyer123@example.com.",
  );
  assert(
    !JSON.stringify({ paid, emailLogs }).includes("guest@stunfry.example"),
    "Real checkout/order/email regression path used guest@stunfry.example.",
  );
  const adminDetail = await getAdminOrder(paid.orderNumber);
  assert(
    adminDetail.order?.customerEmail === "buyer123@example.com" &&
      adminDetail.order.paymentAttempts.some(
        (p: any) =>
          p.status === "APPROVED" &&
          p.providerReference &&
          !p.providerReference.includes("4111111111111111") &&
          !p.providerReference.includes("123"),
      ),
    "Admin order detail lacks real email or safe approved payment attempt display data.",
  );
  assert(
    (await getFulfillmentOrdersForAdmin(actor)).some(
      (o) => o.id === approved.id,
    ),
    "Paid approved order was not released to fulfillment.",
  );
  await prisma.order.update({
    where: { id: approved.id },
    data: {
      fulfillmentStatus: "PICKING",
      assignedFulfillmentUserId: admin.id,
      assignedAt: new Date(),
    },
  });
  const shipped = await shipSingleOrder({
    orderId: approved.id,
    actor,
    carrier: "UPS",
    trackingNumber: "1ZREGRESSION",
  });
  assert(shipped.shipped, "Claimed paid order did not ship.");

  for (const [label, card] of Object.entries({
    zip: {
      cardNumber: "4111111111111111",
      expiration: "12/30",
      cvv: "123",
      nameOnCard: "Regression Buyer",
      postalCode: "46282",
    },
    cvv: {
      cardNumber: "4111111111111111",
      expiration: "12/30",
      cvv: "901",
      nameOnCard: "Regression Buyer",
      postalCode: "78701",
    },
    expired: {
      cardNumber: "4111111111111111",
      expiration: "01/20",
      cvv: "123",
      nameOnCard: "Regression Buyer",
      postalCode: "78701",
    },
  })) {
    const order = await makeOrder(saved, variant, `declined-${label}`);
    const result = await processOrderPayment(prisma, order, "mock_card", card);
    assert(
      result.paymentAttempt.status === "DECLINED",
      `${label} did not decline.`,
    );
    assert(
      !(await getFulfillmentOrdersForAdmin(actor)).some(
        (o) => o.id === order.id,
      ),
      `${label} declined order entered fulfillment.`,
    );
  }
  const blocked = await makeOrder(saved, variant, "blocked-hi", "HI");
  assert(
    blocked.eligibilityResult === "BLOCKED" &&
      !(await getFulfillmentOrdersForAdmin(actor)).some(
        (o) => o.id === blocked.id,
      ),
    "Blocked-state order entered fulfillment.",
  );
  console.log(
    "Regression smoke passed: product persistence/media, storefront visibility, payment, fulfillment, and consistency checks.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((e) => console.error("Cleanup failed", e));
    await prisma.$disconnect();
  });
