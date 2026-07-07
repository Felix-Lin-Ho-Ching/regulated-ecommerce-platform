// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { processOrderPayment } from "../lib/payments/payment-service";
import { releaseOrderAfterPaymentApproval } from "../lib/orders/order-service";
import { evaluateCompliance } from "../lib/compliance/compliance-service";

const prisma = new PrismaClient();
const ORDER_PREFIX = "LOAD-";
const SLUG_PREFIX = "load-test-";
const runId = `${Date.now()}`;
const buyers = Number(process.env.LOAD_CHECKOUT_USERS || 20);
const stock = Number(process.env.LOAD_TEST_STOCK || 10000);
const adultDob = "1980-01-01";

type Card = { cardNumber: string; expiration: string; cvv: string; nameOnCard: string; postalCode: string };
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
function isAdultDob(value: string) { const dob = new Date(`${value}T00:00:00Z`); const adult = new Date(dob); adult.setUTCFullYear(dob.getUTCFullYear() + 18); return !Number.isNaN(dob.getTime()) && adult <= new Date(); }
function guard() { if (process.env.NODE_ENV === "production" || process.env.LOAD_TEST_ENABLED !== "1") throw new Error("Load checkout is disabled unless NODE_ENV is not production and LOAD_TEST_ENABLED=1."); if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required."); }
async function cleanup() {
  const orders = await prisma.order.findMany({ where: { OR: [{ orderNumber: { startsWith: ORDER_PREFIX } }, { customerEmail: { startsWith: SLUG_PREFIX } }] }, select: { id: true } });
  const orderIds = orders.map(o => o.id);
  if (orderIds.length) {
    const itemIds = (await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map(i => i.id);
    await prisma.emailLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.fulfillmentToken.deleteMany({ where: { orderId: { in: orderIds } } });
    if (itemIds.length) await prisma.inventoryReservation.deleteMany({ where: { orderItemId: { in: itemIds } } });
    await prisma.paymentAttempt.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.shippingAddress.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  const products = await prisma.product.findMany({ where: { slug: { startsWith: SLUG_PREFIX } }, include: { variants: true } });
  const variantIds = products.flatMap(p => p.variants.map(v => v.id));
  if (variantIds.length) {
    const inventoryIds = (await prisma.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })).map(i => i.id);
    if (inventoryIds.length) { await prisma.inventoryReservation.deleteMany({ where: { inventoryId: { in: inventoryIds } } }); await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: inventoryIds } } }); }
    await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  }
  await prisma.product.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: SLUG_PREFIX } } });
}
async function seed() {
  const category = await prisma.productCategory.upsert({ where: { slug: `${SLUG_PREFIX}category` }, update: { name: "Load Test Category" }, create: { slug: `${SLUG_PREFIX}category`, name: "Load Test Category" } });
  const product = await prisma.product.create({ data: { slug: `${SLUG_PREFIX}product-${runId}`, brand: "Load Test", name: `${ORDER_PREFIX}Load Test Product`, categoryId: category.id, restrictedClass: "STUN_GUN", description: "Dedicated load-test product; disabled outside load-test runs.", status: "ACTIVE", restricted: true } });
  const variant = await prisma.productVariant.create({ data: { productId: product.id, sku: `${ORDER_PREFIX}SKU-${runId}`, name: "Default", priceCents: 2500, status: "ACTIVE", inventory: { create: { onHand: stock, reserved: 0, reorderThreshold: 100 } } }, include: { inventory: true } });
  return { product, variant };
}
async function createOrder(product: any, variant: any, n: number) {
  assert(isAdultDob(adultDob), "load-test DOB must be an adult DOB");
  const decision = await evaluateCompliance({ restrictedClass: "STUN_GUN", stateCode: "TX" });
  assert(decision.paymentAllowed, `TX compliance did not allow payment: ${decision.reasons.join("; ")}`);
  return prisma.order.create({ data: { orderNumber: `${ORDER_PREFIX}${runId}-${n}`, status: "PENDING_PAYMENT", fulfillmentStatus: "FULFILLMENT_HOLD", subtotalCents: 2500, shippingCents: 0, taxCents: 206, totalCents: 2706, customerEmail: `${SLUG_PREFIX}${runId}-${n}@example.test`, customerName: "Load Test Adult", customerPhone: "5550100000", liveCheckoutEnabled: false, liveFulfillmentEnabled: false, paymentMode: "mock_card", eligibilityResult: "AUTO_ELIGIBLE", shippingAddress: { create: { name: "Load Test Adult", line1: "100 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", country: "US", normalized: true, deliverable: true, phone: "5550100000" } }, items: { create: { productId: product.id, variantId: variant.id, name: product.name, sku: variant.sku, quantity: 1, unitPriceCents: 2500 } } }, include: { items: true } });
}
async function approved(product: any, variant: any, n: number) {
  const order = await createOrder(product, variant, n);
  const result = await processOrderPayment(prisma, order, "mock_card", { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Load Test Adult", postalCode: "78701" });
  assert(result.paymentAttempt.status === "APPROVED", "approved local mock card was not approved");
  await releaseOrderAfterPaymentApproval(order.id, { email: "load-test", role: "SYSTEM" });
  await prisma.emailLog.create({ data: { orderId: order.id, type: "CUSTOMER_ORDER_CONFIRMATION", to: order.customerEmail!, subject: `Order confirmation ${order.orderNumber}`, provider: "debug", status: "SENT", text: "debug load test confirmation" } });
}
async function declined(product: any, variant: any, n: number, card: Card) {
  const order = await createOrder(product, variant, n);
  const result = await processOrderPayment(prisma, order, "mock_card", card);
  await prisma.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED", fulfillmentStatus: "FULFILLMENT_HOLD", liveFulfillmentEnabled: false } });
  assert(result.paymentAttempt.status === "DECLINED", `${order.orderNumber} did not decline`);
}
async function main() {
  guard(); await cleanup(); const { product, variant } = await seed();
  await Promise.all(Array.from({ length: buyers }, (_, i) => approved(product, variant, i)));
  const declines: Card[] = [
    { cardNumber: "4111111111111111", expiration: "12/30", cvv: "901", nameOnCard: "Load Test Adult", postalCode: "78701" },
    { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Load Test Adult", postalCode: "46282" },
    { cardNumber: "4111111111111111", expiration: "01/20", cvv: "123", nameOnCard: "Load Test Adult", postalCode: "78701" },
    { cardNumber: "4111111111111112", expiration: "12/30", cvv: "123", nameOnCard: "Load Test Adult", postalCode: "78701" },
  ];
  await Promise.all(declines.map((card, i) => declined(product, variant, buyers + i, card)));
  const shippableFailed = await prisma.order.count({ where: { orderNumber: { startsWith: ORDER_PREFIX }, status: "PAYMENT_FAILED", OR: [{ fulfillmentStatus: "READY_TO_SHIP" }, { liveFulfillmentEnabled: true }] } });
  assert(shippableFailed === 0, "failed payments became shippable");
  console.log(`load:checkout completed approved=${buyers} declined=${declines.length} product=${product.slug}`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
