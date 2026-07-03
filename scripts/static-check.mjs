import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const mode = process.argv[2] || 'smoke';
const files = [];
function walk(dir){ for (const name of readdirSync(dir)){ const p=join(dir,name); const st=statSync(p); if(st.isDirectory() && !['.git','node_modules','.next'].includes(name)) walk(p); else if(st.isFile() && /\.(tsx|ts|css|md|json)$/.test(name)) files.push(p.replaceAll("\\", "/")); }}
walk(process.cwd());
const required = ['app/page.tsx','app/products/page.tsx','app/checkout/page.tsx','app/admin/page.tsx','docs/current-ux.md'];
const missing = required.filter(p=>!files.some(f=>f.endsWith(p)));
if(missing.length){ console.error('Missing required files:', missing.join(', ')); process.exit(1); }
if(mode==='lint'){
  const bad = files.filter(f=>/\.(tsx|ts)$/.test(f)).filter(f=>readFileSync(f,'utf8').includes('TODO_BACKEND'));
  if(bad.length){ console.error('Unexpected backend TODO markers:', bad.join(', ')); process.exit(1); }
  const customerFacingFiles = files.filter((file) => /\.(tsx|ts)$/.test(file))
    .filter((file) => (file.includes('/app/') || file.includes('/components/') || file.endsWith('/lib/eligibility/public-state-requirements.ts')))
    .filter((file) => !file.includes('/admin/'));
  const forbiddenCustomerPhrases = [
    'CHECK STATE GUIDANCE',
    'manual review',
    'pending_admin_review',
    'pending_document_upload',
    'compliance coverage',
    'rule engine',
  ];
  const phraseHits = [];
  for (const file of customerFacingFiles) {
    const text = readFileSync(file, 'utf8').toLowerCase();
    for (const phrase of forbiddenCustomerPhrases) {
      if (text.includes(phrase.toLowerCase())) phraseHits.push(`${file}: ${phrase}`);
    }
  }
  if(phraseHits.length){ console.error('Forbidden customer-facing phrases found:\n' + phraseHits.join('\n')); process.exit(1); }
  const stateRules = readFileSync('lib/compliance/restricted-state-rules.ts', 'utf8');
  const stateListMatch = stateRules.match(/usStateAndDcCodes = \[([\s\S]*?)\] as const/);
  const states = stateListMatch ? [...stateListMatch[1].matchAll(/"([A-Z]{2})"/g)].map((match) => match[1]) : [];
  const expectedStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
  const missingStates = expectedStates.filter((state) => !states.includes(state));
  const extraStates = states.filter((state) => !expectedStates.includes(state));
  if(states.length !== 51 || missingStates.length || extraStates.length){ console.error(`Restricted state list must be exactly 50 states + DC. Found ${states.length}; missing: ${missingStates.join(',')}; extra: ${extraStates.join(',')}`); process.exit(1); }
  const seedText = readFileSync('prisma/seed.ts', 'utf8');
  const requiredSeedPhrases = [
    'Development rule based on Self Defense Mall stun-gun laws reference; counsel review required before production.',
    'Allowed by development stun-gun state reference; counsel review required before production.',
    'Blocked by development stun-gun state reference.',
  ];
  const missingSeedPhrases = requiredSeedPhrases.filter((phrase) => !seedText.includes(phrase));
  if(missingSeedPhrases.length){ console.error('Seed is missing required stun-gun development rule text:\n' + missingSeedPhrases.join('\n')); process.exit(1); }
  for (const state of ['DC', 'HI', 'MA']) {
    if(!seedText.includes(state)){ console.error(`Seed is missing required blocked stun-gun state ${state}.`); process.exit(1); }
  }

  const productForm = readFileSync('components/admin/products/product-form.tsx', 'utf8');
  const validation = readFileSync('lib/products/validation.ts', 'utf8');
  const gallery = readFileSync('components/store/product-media-gallery.tsx', 'utf8');
  const requiredProductFormText = ['Basic product info', 'Pricing and inventory', 'Compliance', 'Product media', 'Product page content', 'SEO', 'Save / publish controls', 'mediaYoutubeUrl', 'STUN_GUN'];
  const missingProductFormText = requiredProductFormText.filter((text) => !productForm.includes(text));
  if(missingProductFormText.length){ console.error('Admin product form missing grouped UX text: ' + missingProductFormText.join(', ')); process.exit(1); }
  const requiredYoutubeValidationText = ['extractYouTubeVideoId', 'youtu.be', '/watch', 'enter a valid YouTube URL'];
  const missingYoutubeValidationText = requiredYoutubeValidationText.filter((text) => !validation.includes(text));
  if(missingYoutubeValidationText.length){ console.error('YouTube validation missing: ' + missingYoutubeValidationText.join(', ')); process.exit(1); }
  const requiredGalleryText = ['youtube-nocookie.com/embed', 'allowFullScreen', 'aria-label', 'img.youtube.com/vi'];
  const missingGalleryText = requiredGalleryText.filter((text) => !gallery.includes(text));
  if(missingGalleryText.length){ console.error('Product gallery missing YouTube embed behavior: ' + missingGalleryText.join(', ')); process.exit(1); }
  console.log(`Static lint passed for ${files.length} files.`);
} else if(mode==='typecheck'){
  const text = files.filter(f=>/\.(tsx|ts)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('\n');
  for (const token of ['CheckoutOutcome','StatusTone','React.ReactNode']) if(!text.includes(token)){ console.error(`Expected type token missing: ${token}`); process.exit(1); }
  console.log('Static typecheck proxy passed; TypeScript dependency unavailable in this environment.');
} else {
  const routeCount = files.filter(f=>f.endsWith('page.tsx')).length;
  if(routeCount < 40){ console.error(`Expected at least 40 routes, found ${routeCount}`); process.exit(1); }
  const checkout = readFileSync('components/checkout/one-page-checkout.tsx', 'utf8');
  const requiredCheckoutText = ['Card number', 'Expiration date MM/YY', 'Security code', 'Name on card', 'Use shipping address as billing address', 'Complete checkout'];
  const missingCheckoutText = requiredCheckoutText.filter((text) => !checkout.includes(text));
  if(missingCheckoutText.length){ console.error('Checkout UI missing required payment text: ' + missingCheckoutText.join(', ')); process.exit(1); }
  const stateConstants = readFileSync('lib/checkout/us-states.ts', 'utf8');
  const checkoutActions = readFileSync('lib/checkout/actions.ts', 'utf8');
  const requiredStateDropdownText = [
    'function StateSelect',
    '<select className="input mt-1" name={name}',
    '<option value="">Select state</option>',
    'name="state" value={address.state}',
    'onChange={(value) => updateAddress("state", value)}',
    'name="billingState" value={billing.state}',
    'onChange={(value) => updateBilling("state", value)}',
    '{state.code} — {state.name}',
    'Date of birth',
  ];
  const missingStateDropdownText = requiredStateDropdownText.filter((text) => !checkout.includes(text));
  if(missingStateDropdownText.length){ console.error('Checkout UI missing required state dropdown behavior: ' + missingStateDropdownText.join(', ')); process.exit(1); }
  for (const forbidden of ['name="state" maxLength={2}', 'name="billingState" maxLength={2}']) {
    if(checkout.includes(forbidden)){ console.error(`Checkout state field is still free text: ${forbidden}`); process.exit(1); }
  }
  const requiredStateConstants = ['{ code: "TX", name: "Texas" }', '{ code: "HI", name: "Hawaii" }', '{ code: "MA", name: "Massachusetts" }', '{ code: "DC", name: "District of Columbia" }', 'export function isValidUsStateCode', 'export function normalizeUsStateCode'];
  const missingStateConstants = requiredStateConstants.filter((text) => !stateConstants.includes(text));
  if(missingStateConstants.length){ console.error('US state constants missing required checkout state coverage: ' + missingStateConstants.join(', ')); process.exit(1); }
  const requiredBackendStateValidation = ['normalizeUsStateCode(required(formData, "state"))', '!isValidUsStateCode(state)', 'redirect("/checkout?error=address")', 'normalizeUsStateCode(required(formData, "billingState"))', '!isValidUsStateCode(billingState)'];
  const missingBackendStateValidation = requiredBackendStateValidation.filter((text) => !checkoutActions.includes(text));
  if(missingBackendStateValidation.length){ console.error('Checkout backend missing required invalid state rejection: ' + missingBackendStateValidation.join(', ')); process.exit(1); }
  for (const forbidden of ['AgeChecker', 'Sezzle', 'Buy Now Pay Later', 'I confirm I am at least 18 years old', 'ageAttestation']) {
    if(checkout.includes(forbidden)){ console.error(`Checkout UI contains forbidden text: ${forbidden}`); process.exit(1); }
  }
  console.log(`Smoke check passed with ${routeCount} page routes.`);
}


