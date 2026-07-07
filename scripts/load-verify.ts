// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const ORDER_PREFIX = "LOAD-";
const SLUG_PREFIX = "load-test-";
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
function guard() { if (process.env.NODE_ENV === "production" || process.env.LOAD_TEST_ENABLED !== "1") throw new Error("Load verify is disabled unless NODE_ENV is not production and LOAD_TEST_ENABLED=1."); if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required."); }
async function cleanup() {
  const orders = await prisma.order.findMany({ where: { OR: [{ orderNumber: { startsWith: ORDER_PREFIX } }, { customerEmail: { startsWith: SLUG_PREFIX } }] }, select: { id: true } });
  const orderIds = orders.map(o => o.id);
  if (orderIds.length) {
    const itemIds = (await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map(i => i.id);
    await prisma.emailLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.fulfillmentToken.deleteMany({ where: { orderId: { in: orderIds } } });
    if (itemIds.length) await prisma.inventoryReservation.deleteMany({ where: { orderItemId: { in: itemIds } } });
    await prisma.paymentAttempt.deleteMany({ where: { orderId: { in: orderIds } } }); await prisma.shippingAddress.deleteMany({ where: { orderId: { in: orderIds } } }); await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }); await prisma.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: orderIds } } }); await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  const products = await prisma.product.findMany({ where: { slug: { startsWith: SLUG_PREFIX } }, include: { variants: true } });
  const variantIds = products.flatMap(p => p.variants.map(v => v.id));
  if (variantIds.length) { const inventoryIds = (await prisma.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })).map(i => i.id); if (inventoryIds.length) { await prisma.inventoryReservation.deleteMany({ where: { inventoryId: { in: inventoryIds } } }); await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: inventoryIds } } }); } await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } }); await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } }); }
  await prisma.product.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } }); await prisma.user.deleteMany({ where: { email: { startsWith: SLUG_PREFIX } } });
}
async function main() {
  guard();
  const inventories = await prisma.inventory.findMany({ where: { variant: { product: { slug: { startsWith: SLUG_PREFIX } } } } });
  assert(inventories.every(i => i.reserved <= i.onHand), "oversold inventory detected");
  const orders = await prisma.order.findMany({ where: { orderNumber: { startsWith: ORDER_PREFIX } }, include: { paymentAttempts: true, emailLogs: true, items: { include: { reservations: true } } } });
  assert(orders.length > 0, "no load-test orders found to verify");
  for (const order of orders) {
    const approved = order.paymentAttempts.some(p => p.status === "APPROVED" && p.provider === "AUTHORIZE_NET_MOCK");
    assert(!(order.status === "PAID" && !approved), `${order.orderNumber} is PAID without approved payment`);
    assert(!(order.fulfillmentStatus === "READY_TO_SHIP" && !order.items.every(i => i.reservations.some(r => r.status === "ACTIVE"))), `${order.orderNumber} READY_TO_SHIP without active reservation`);
    assert(!(approved && !order.emailLogs.some(e => e.type === "CUSTOMER_ORDER_CONFIRMATION")), `${order.orderNumber} successful order missing confirmation email log`);
    assert(!(order.status === "SHIPPED" && !order.emailLogs.some(e => e.type === "CUSTOMER_SHIPMENT")), `${order.orderNumber} shipped order missing shipment email log`);
  }
  const attempts = await prisma.paymentAttempt.findMany({ where: { order: { orderNumber: { startsWith: ORDER_PREFIX } } } });
  const forbidden = /4111111111111111|\b\d{3,4}\b.*cvv|cvv.*\b\d{3,4}\b/i;
  assert(attempts.every(a => !forbidden.test(JSON.stringify(a))), "raw card number or CVV appears stored in payment attempts");
  console.log(`load:verify completed orders=${orders.length} inventories=${inventories.length}`);
  await cleanup();
  console.log("load-test cleanup completed");
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
