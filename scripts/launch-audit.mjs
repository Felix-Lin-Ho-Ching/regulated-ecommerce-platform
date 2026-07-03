import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error(`Launch audit failed: ${message}`);
  process.exit(1);
}
function requireText(source, text, message) {
  const content = source.includes('\n') ? source : readFileSync(source, 'utf8');
  if (!content.includes(text)) fail(message ?? `Required text missing: ${text}`);
}

const adminAuth = readFileSync('lib/admin/auth.ts', 'utf8');
const session = readFileSync('lib/auth/session.ts', 'utf8');
const seed = readFileSync('prisma/seed.ts', 'utf8');
const orderService = readFileSync('lib/orders/order-service.ts', 'utf8');
const checkout = readFileSync('lib/checkout/actions.ts', 'utf8');
const productService = readFileSync('lib/products/service.ts', 'utf8');
const validation = readFileSync('lib/products/validation.ts', 'utf8');
const catalog = readFileSync('lib/db/catalog.ts', 'utf8');
const fulfillment = readFileSync('lib/fulfillment/admin-queries.ts', 'utf8') + readFileSync('lib/fulfillment/ship-orders.ts', 'utf8');
const form = readFileSync('components/admin/products/product-form.tsx', 'utf8');

if (!adminAuth.includes('process.env.NODE_ENV === "production" && !configuredSecret')) fail('production admin sessions could use fallback AUTH_SECRET.');
if (!session.includes('process.env.NODE_ENV === "production" && !configuredSecret')) fail('production customer sessions could use fallback AUTH_SECRET.');
if (!adminAuth.includes('process.env.NODE_ENV === "production" && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)')) fail('production fallback admin credentials are possible.');
const prodSeedBranch = seed.match(/if \(process\.env\.NODE_ENV === "production"\) \{[\s\S]*?\n  \} else \{/);
if (!prodSeedBranch) fail('seed does not isolate production from local default credentials.');
if (prodSeedBranch[0].includes('linhochingfelix') || prodSeedBranch[0].includes('shipping123')) fail('production seed branch contains known local passwords.');
if (orderService.includes('guest@stunfry.example')) fail('guest fallback email is present in checkout order service.');
requireText(checkout, 'customerEmail: email', 'checkout submit does not pass submitted email.');
requireText(orderService, 'customerEmail: customerEmail ?? ""', 'payment gateway metadata can miss the submitted customer email.');
requireText(checkout, 'restrictedClass: restrictedLine.product.restrictedClass ?? undefined', 'restricted checkout may bypass restrictedClass.');
requireText(checkout, 'if (destination.status !== "allowed") redirect("/checkout?error=blocked")', 'blocked states may reach payment.');
requireText(orderService, 'fulfillmentStatus: "FULFILLMENT_HOLD"', 'declined payments may leave fulfillment released.');
if (/cardNumber\s*[:=]|cvv\s*[:=]/.test(readFileSync('prisma/schema.prisma', 'utf8'))) fail('schema appears able to persist raw card number or CVV.');
requireText(catalog, 'status: { in: [...storefrontVisibleStatuses] }', 'draft products may appear on storefront.');
requireText(productService, 'shouldReplaceCollection', 'product media/content may be wiped by unrelated save.');
requireText(form, 'Save the product as draft before adding images or YouTube videos.', 'new product media controls are not disabled until product exists.');
if (form.includes('accept="video/') || validation.includes('VIDEO')) fail('product video file upload appears to be enabled.');
requireText(fulfillment, 'status: "PAID"', 'fulfillment queries/actions are not gated on paid orders.');
requireText(fulfillment, 'fulfillmentStatus: { in: ["READY_TO_SHIP", "PICKING"] }', 'fulfillment does not require releasable states.');

if (process.env.LAUNCH_AUDIT_SKIP_REGRESSION !== '1') {
  const result = spawnSync('npm', ['run', 'regression:test'], { stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Launch audit passed.');
