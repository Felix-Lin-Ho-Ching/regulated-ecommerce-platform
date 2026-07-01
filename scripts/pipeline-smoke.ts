import { PrismaClient } from "@prisma/client";
import { shipOrders, shipSingleOrder } from "../lib/fulfillment/ship-orders";
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
  const category = await prisma.productCategory.upsert({ where: { slug: "stun-guns" }, update: {}, create: { slug: "stun-guns", name: "Stun Guns" } });
  const product = await prisma.product.create({ data: { slug: `pipeline-smoke-${runId}`, brand: "Smoke", name: "Pipeline Smoke Stun Device", categoryId: category.id, restrictedClass: "STUN_GUN", description: "Ephemeral restricted product for backend pipeline smoke tests.", status: "ACTIVE", restricted: true } });
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
  const claimedOrder = await prisma.order.findUniqueOrThrow({ where: { id: approved.id } });
  assert(claimedOrder.fulfillmentStatus === "PICKING" && claimedOrder.assignedFulfillmentUserId === admin.id, "Claim did not move READY_TO_SHIP to PICKING with assignment.");
  const missingTracking = await shipSingleOrder({ orderId: approved.id, actor, carrier: "UPS" });
  assert(!missingTracking.shipped && missingTracking.error?.includes("Tracking number is required"), "Shipment tracking gate did not require a tracking number.");
  const shipped = await shipSingleOrder({ orderId: approved.id, actor, carrier: "UPS", trackingNumber: "1ZPIPE0002" });
  assert(shipped.shipped && shipped.orderId === approved.id, `Paid order did not ship: ${shipped.error || "unknown error"}`);
  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: approved.id }, include: { emailLogs: true, items: { include: { reservations: true } } } });
  assert(finalOrder.status === "SHIPPED" && finalOrder.fulfillmentStatus === "SHIPPED", "Final order did not reach shipped state.");
  assert(finalOrder.carrier === "UPS" && finalOrder.trackingNumber === "1ZPIPE0002" && finalOrder.shippedAt, "Carrier, tracking number, or shippedAt was not saved.");
  assert(finalOrder.emailLogs.some((email: { type: string }) => email.type === "CUSTOMER_SHIPMENT"), "Buyer shipment debug email was not created.");
  assert(finalOrder.items.every((item: any) => item.reservations.every((reservation: any) => reservation.status === "CONSUMED")), "Inventory reservation was not consumed.");
  assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === approved.id), "Shipped order appeared in active fulfillment dashboard.");

  const batchA = await createOrder(product, variant, "PAID", "batch_guard");
  const batchB = await createOrder(product, variant, "PAID", "batch_guard");
  const batchRejected = await shipOrders({ orderIds: [batchA.id, batchB.id], actor, carrier: "UPS", trackingNumber: "1ZSHARED" });
  assert(batchRejected.errors.some((error) => error.includes("Batch shipping with one shared tracking number is disabled")), "Batch shipping with one shared tracking number was not rejected.");

  const declined = await createOrder(product, variant, "PENDING_PAYMENT", "mock_declined");
  await reserve(declined, variant.inventory.id);
  await processOrderPayment(prisma, declined, "mock_declined");
  await prisma.order.update({ where: { id: declined.id }, data: { status: "PAYMENT_FAILED" } });
  assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === declined.id), "mock_declined order appeared in fulfillment dashboard.");

  const cardApproved = await createOrder(product, variant, "PENDING_PAYMENT", "mock_card");
  const cardApprovedResult = await processOrderPayment(prisma, cardApproved, "mock_card", { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Manual Buyer", postalCode: "78701" });
  assert(cardApprovedResult.paymentAttempt.status === "APPROVED", "Approved mock card was not approved.");
  assert(!cardApprovedResult.paymentAttempt.providerReference?.includes("4111111111111111"), "Full card number was stored.");
  assert(!cardApprovedResult.paymentAttempt.providerReference?.includes("123"), "CVV was stored.");
  await releaseOrderAfterPaymentApproval(cardApproved.id, { email: "pipeline-smoke", role: "SYSTEM" });
  const cardPaid = await prisma.order.findUniqueOrThrow({ where: { id: cardApproved.id } });
  assert(cardPaid.status === "PAID" && cardPaid.fulfillmentStatus === "READY_TO_SHIP" && cardPaid.liveFulfillmentEnabled, "Approved mock_card did not release fulfillment.");

  for (const [label, card] of Object.entries({ zip: { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Manual Buyer", postalCode: "46282" }, cvv: { cardNumber: "4111111111111111", expiration: "12/30", cvv: "901", nameOnCard: "Manual Buyer", postalCode: "78701" }, expired: { cardNumber: "4111111111111111", expiration: "01/20", cvv: "123", nameOnCard: "Manual Buyer", postalCode: "78701" }, invalid: { cardNumber: "4111111111111112", expiration: "12/30", cvv: "123", nameOnCard: "Manual Buyer", postalCode: "78701" } })) {
    const cardDeclined = await createOrder(product, variant, "PENDING_PAYMENT", `mock_card_${label}`);
    const result = await processOrderPayment(prisma, cardDeclined, "mock_card", card);
    await prisma.order.update({ where: { id: cardDeclined.id }, data: { status: "PAYMENT_FAILED", fulfillmentStatus: "FULFILLMENT_HOLD", liveFulfillmentEnabled: false } });
    assert(result.paymentAttempt.status === "DECLINED", `${label} mock card did not decline.`);
    assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === cardDeclined.id), `${label} declined mock card appeared in fulfillment dashboard.`);
  }

  const requested = await createOrder(product, variant, "READY_FOR_PAYMENT", "order_request");
  await reserve(requested, variant.inventory.id);
  await processOrderPayment(prisma, requested, "order_request");
  assert(!(await getFulfillmentOrdersForAdmin(actor)).some((order) => order.id === requested.id), "order_request order appeared in fulfillment dashboard.");

  console.log(`Pipeline smoke passed for ${approved.orderNumber}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await cleanup().catch((error) => console.error("Cleanup failed", error)); await prisma.$disconnect(); });
