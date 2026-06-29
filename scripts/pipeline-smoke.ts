import { PrismaClient } from "@prisma/client";
import { shipOrders } from "../lib/fulfillment/ship-orders";
import { getFulfillmentOrdersForAdmin } from "../lib/fulfillment/admin-queries";
import { processOrderPayment } from "../lib/payments/payment-service";
import { releaseOrderAfterPaymentApproval } from "../lib/orders/order-service";
import type { AdminSession } from "../lib/admin/auth";

const prisma = new PrismaClient();
const runId = `pipeline-smoke-${Date.now()}`;
const sku = `PIPE-${Date.now()}`;

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const orders = await prisma.order.findMany({ where: { orderNumber: { startsWith: "PIPE-" } }, select: { id: true } });
  const orderIds = orders.map((order: { id: string }) => order.id);
  if (orderIds.length) {
    await prisma.emailLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.fulfillmentToken.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.inventoryReservation.deleteMany({ where: { orderItemId: { in: (await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((item: { id: string }) => item.id) } } });
    await prisma.paymentAttempt.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.shippingAddress.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  const products = await prisma.product.findMany({ where: { slug: { startsWith: "pipeline-smoke-" } }, include: { variants: true } });
  const variantIds = products.flatMap((product: { variants: Array<{ id: string }> }) => product.variants.map((variant: { id: string }) => variant.id));
  if (variantIds.length) {
    const inventoryIds = (await prisma.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })).map((inventory: { id: string }) => inventory.id);
    if (inventoryIds.length) await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: inventoryIds } } });
    await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  }
  await prisma.product.deleteMany({ where: { slug: { startsWith: "pipeline-smoke-" } } });
  await prisma.adminUser.deleteMany({ where: { email: { endsWith: "@pipeline-smoke.local" } } });
}

async function reserve(order: any, inventoryId: string) {
  await prisma.inventory.update({ where: { id: inventoryId }, data: { reserved: { increment: 1 }, reservations: { create: { orderItemId: order.items[0].id, quantity: 1 } }, transactions: { create: { type: "RESERVATION", quantity: 1, reason: `${order.orderNumber} pipeline smoke reservation` } } } });
}

async function createOrder(product: any, variant: any, status: string, mode: string) {
  const orderNumber = `PIPE-${mode}-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
  return prisma.order.create({
    data: {
      orderNumber, status, fulfillmentStatus: "FULFILLMENT_HOLD", subtotalCents: 2500, shippingCents: 0, taxCents: 0, totalCents: 2500,
      customerEmail: "buyer@pipeline-smoke.local", customerName: "Pipeline Buyer", liveCheckoutEnabled: false, liveFulfillmentEnabled: false, paymentMode: mode, eligibilityResult: "AUTO_ELIGIBLE",
      shippingAddress: { create: { name: "Pipeline Buyer", line1: "1 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", normalized: true, deliverable: true } },
      items: { create: { productId: product.id, variantId: variant.id, name: product.name, sku, quantity: 1, unitPriceCents: 2500 } },
    },
    include: { items: true },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pipeline smoke tests.");
  await cleanup();

  const role = await prisma.adminRole.upsert({ where: { code: "FULFILLMENT" }, update: {}, create: { code: "FULFILLMENT", name: "Fulfillment" } });
  const admin = await prisma.adminUser.create({ data: { email: `${runId}@pipeline-smoke.local`, name: "Pipeline Smoke Fulfillment", passwordHash: "not-used", roleId: role.id } });
  const product = await prisma.product.create({ data: { slug: `pipeline-smoke-${runId}`, brand: "Smoke", name: "Pipeline Smoke Stun Device", category: "stun_gun", description: "Ephemeral restricted product for backend pipeline smoke tests.", status: "ACTIVE", restricted: true } });
  const variant = await prisma.productVariant.create({ data: { productId: product.id, sku, name: "Default", priceCents: 2500, status: "ACTIVE", inventory: { create: { onHand: 6, reserved: 0, reorderThreshold: 1 } } }, include: { inventory: true } });
  assert(variant.inventory, "Seed inventory was not created.");
  const actor: AdminSession = { adminId: admin.id, email: admin.email, name: admin.name, role: "FULFILLMENT", demo: false };

  const approved = await createOrder(product, variant, "PENDING_PAYMENT", "mock_approved");
  await processOrderPayment(prisma, approved, "mock_approved");
  await releaseOrderAfterPaymentApproval(approved.id, { email: "pipeline-smoke", role: "SYSTEM" });
  const paid = await prisma.order.findUniqueOrThrow({ where: { id: approved.id }, include: { paymentAttempts: { orderBy: { createdAt: "desc" } } } });
  assert(paid.status === "PAID" && paid.fulfillmentStatus === "READY_TO_SHIP" && paid.liveFulfillmentEnabled, "mock_approved did not release to fulfillment.");
  assert(paid.paymentAttempts[0].provider === "AUTHORIZE_NET_MOCK" && paid.paymentAttempts[0].status === "APPROVED", "Approved mock payment attempt missing.");

  const dashboard = await getFulfillmentOrdersForAdmin(actor);
  assert(dashboard.some((order) => order.id === approved.id), "Paid ready-to-ship order did not appear in fulfillment dashboard.");
  await prisma.order.update({ where: { id: approved.id }, data: { fulfillmentStatus: "PICKING", assignedFulfillmentUserId: admin.id, assignedAt: new Date() } });
  assert((await shipOrders({ orderIds: [approved.id], actor, carrier: "UPS" })).errors.some((error) => error.includes("Tracking number is required")), "Shipment tracking gate did not require a tracking number.");
  const shipped = await shipOrders({ orderIds: [approved.id], actor, carrier: "UPS", trackingNumber: "1ZPIPE0002" });
  assert(shipped.shipped.includes(approved.id), `Paid order did not ship: ${shipped.errors.join(" ")}`);
  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: approved.id }, include: { emailLogs: true } });
  assert(finalOrder.status === "SHIPPED" && finalOrder.fulfillmentStatus === "SHIPPED", "Final order did not reach shipped state.");
  assert(finalOrder.emailLogs.some((email: { type: string }) => email.type === "CUSTOMER_SHIPMENT"), "Buyer shipment debug email was not created.");

  const declined = await createOrder(product, variant, "PENDING_PAYMENT", "mock_declined");
  await reserve(declined, variant.inventory.id);
  await processOrderPayment(prisma, declined, "mock_declined");
  await prisma.order.update({ where: { id: declined.id }, data: { status: "PAYMENT_FAILED" } });
  assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === declined.id), "mock_declined order appeared in fulfillment dashboard.");

  const requested = await createOrder(product, variant, "READY_FOR_PAYMENT", "order_request");
  await reserve(requested, variant.inventory.id);
  await processOrderPayment(prisma, requested, "order_request");
  assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === requested.id), "order_request order appeared in fulfillment dashboard.");

  console.log(`Pipeline smoke passed for ${approved.orderNumber}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await cleanup().catch((error) => console.error("Cleanup failed", error)); await prisma.$disconnect(); });
