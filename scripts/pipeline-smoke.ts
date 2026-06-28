import { PrismaClient } from "@prisma/client";
import { shipOrders } from "../lib/fulfillment/ship-orders";
import type { AdminSession } from "../lib/admin/auth";

const prisma = new PrismaClient();
const runId = `pipeline-smoke-${Date.now()}`;
const sku = `PIPE-${Date.now()}`;
const orderNumber = `PIPE-${Date.now().toString().slice(-8)}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pipeline smoke tests.");
  await cleanup();

  const role = await prisma.adminRole.upsert({ where: { code: "FULFILLMENT" }, update: {}, create: { code: "FULFILLMENT", name: "Fulfillment" } });
  const admin = await prisma.adminUser.create({ data: { email: `${runId}@pipeline-smoke.local`, name: "Pipeline Smoke Fulfillment", passwordHash: "not-used", roleId: role.id } });
  const product = await prisma.product.create({ data: { slug: `pipeline-smoke-${runId}`, brand: "Smoke", name: "Pipeline Smoke Alarm", category: "personal_safety_alarm", description: "Ephemeral product for backend pipeline smoke tests.", status: "ACTIVE", restricted: false } });
  const variant = await prisma.productVariant.create({ data: { productId: product.id, sku, name: "Default", priceCents: 2500, status: "ACTIVE", inventory: { create: { onHand: 3, reserved: 0, reorderThreshold: 1 } } }, include: { inventory: true } });
  assert(variant.inventory, "Seed inventory was not created.");

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: "READY_FOR_PAYMENT",
      fulfillmentStatus: "FULFILLMENT_HOLD",
      subtotalCents: 2500,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 2500,
      customerEmail: "buyer@pipeline-smoke.local",
      customerName: "Pipeline Buyer",
      liveCheckoutEnabled: false,
      liveFulfillmentEnabled: false,
      paymentMode: "order_request",
      eligibilityResult: "AUTO_ELIGIBLE",
      shippingAddress: { create: { name: "Pipeline Buyer", line1: "1 Test Way", city: "Austin", state: "TX", postalCode: "78701", normalized: true, deliverable: true } },
      items: { create: { productId: product.id, variantId: variant.id, name: product.name, sku, quantity: 1, unitPriceCents: 2500 } },
      paymentAttempts: { create: { provider: "ORDER_REQUEST", providerStatus: "ORDER_REQUEST", status: "ORDER_REQUEST", amountCents: 2500, livePaymentEnabled: false, providerReference: `${orderNumber}-request` } },
    },
    include: { items: true, paymentAttempts: true },
  });
  await prisma.inventory.update({ where: { id: variant.inventory.id }, data: { reserved: { increment: 1 }, reservations: { create: { orderItemId: order.items[0].id, quantity: 1 } }, transactions: { create: { type: "RESERVATION", quantity: 1, reason: `${orderNumber} pipeline smoke reservation` } } } });

  const actor: AdminSession = { adminId: admin.id, email: admin.email, name: admin.name, role: "FULFILLMENT", demo: false };
  const blockedShip = await shipOrders({ orderIds: [order.id], actor, carrier: "UPS", trackingNumber: "1ZPIPE0001" });
  assert(blockedShip.shipped.length === 0, "Unpaid order unexpectedly shipped.");
  assert(blockedShip.errors.some((error) => error.includes("unpaid")), "Unpaid shipment gate did not return the expected error.");

  await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", fulfillmentStatus: "READY_TO_SHIP", assignedFulfillmentUserId: admin.id, assignedAt: new Date() } });
  await prisma.paymentAttempt.create({ data: { orderId: order.id, provider: "MOCK", providerStatus: "DEVELOPMENT_APPROVED", status: "APPROVED", amountCents: 2500, livePaymentEnabled: false, providerReference: `${orderNumber}-approved` } });

  const shipped = await shipOrders({ orderIds: [order.id], actor, carrier: "UPS", trackingNumber: "1ZPIPE0002" });
  assert(shipped.shipped.includes(order.id), `Paid ready-to-ship order did not ship: ${shipped.errors.join(" ")}`);

  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, paymentAttempts: { orderBy: { createdAt: "desc" } } } });
  const finalInventory = await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id }, include: { reservations: true } });
  assert(finalOrder.status === "SHIPPED" && finalOrder.fulfillmentStatus === "SHIPPED" && finalOrder.shippedAt, "Final order did not reach shipped state.");
  assert(finalOrder.paymentAttempts[0].status === "APPROVED", "Latest payment attempt is not approved.");
  assert(finalInventory.onHand === 2, `Expected onHand 2 after shipment, got ${finalInventory.onHand}.`);
  assert(finalInventory.reserved === 0, `Expected reserved 0 after shipment, got ${finalInventory.reserved}.`);
  assert(finalInventory.reservations.every((reservation: { status: string }) => reservation.status === "CONSUMED"), "Active reservation was not consumed.");

  console.log(`Pipeline smoke passed for ${orderNumber}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((error) => console.error("Cleanup failed", error));
    await prisma.$disconnect();
  });
