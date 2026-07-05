import { prisma } from "@/lib/db/prisma";
import { sendCustomerOrderTemplate } from "@/lib/email/send-transactional";
import type { AdminSession } from "@/lib/admin/auth";
import { buildTrackingUrl } from "@/lib/orders/order-service";
import { FULFILLMENT_OPERATIONS_ONLY_MESSAGE } from "@/lib/fulfillment/policy";

export type ShipOrdersInput = { orderIds: string[]; actor: AdminSession; carrier?: string; trackingNumber?: string };
export type ShipOrdersResult = { shipped: string[]; skipped: string[]; errors: string[] };
export type ShipSingleOrderInput = { orderId: string; actor: AdminSession; carrier?: string; trackingNumber?: string };
export type ShipSingleOrderResult = { shipped: boolean; orderId?: string; orderNumber?: string; error?: string };

const MIN_TRACKING_LENGTH = 6;

export function validateShipmentTracking(carrier?: string, trackingNumber?: string) {
  const cleanCarrier = (carrier || "").trim();
  const cleanTrackingNumber = (trackingNumber || "").trim();
  if (!cleanCarrier) return { error: "Carrier is required before marking an order shipped." };
  if (!cleanTrackingNumber) return { error: "Tracking number is required before marking an order shipped." };
  if (cleanTrackingNumber.length < MIN_TRACKING_LENGTH) return { error: `Tracking number must be at least ${MIN_TRACKING_LENGTH} characters.` };
  return { carrier: cleanCarrier, trackingNumber: cleanTrackingNumber };
}

export async function shipOrders(input: ShipOrdersInput): Promise<ShipOrdersResult> {
  if (input.actor.role !== "FULFILLMENT") return { shipped: [], skipped: [], errors: [FULFILLMENT_OPERATIONS_ONLY_MESSAGE] };
  const orderIds = Array.from(new Set(input.orderIds.filter(Boolean)));
  if (!orderIds.length) return { shipped: [], skipped: [], errors: ["Select at least one order."] };
  if (orderIds.length > 1) return { shipped: [], skipped: [], errors: ["Batch shipping with one shared tracking number is disabled. Ship each order individually."] };
  const single = await shipSingleOrder({ orderId: orderIds[0], actor: input.actor, carrier: input.carrier, trackingNumber: input.trackingNumber });
  return single.shipped && single.orderId ? { shipped: [single.orderId], skipped: [], errors: [] } : { shipped: [], skipped: [], errors: [single.error || "Order could not be shipped."] };
}

export async function shipSingleOrder(input: ShipSingleOrderInput): Promise<ShipSingleOrderResult> {
  if (input.actor.role !== "FULFILLMENT") return { shipped: false, error: FULFILLMENT_OPERATIONS_ONLY_MESSAGE };
  const orderId = input.orderId;
  if (!orderId) return { shipped: false, error: "Select an order to ship." };
  const tracking = validateShipmentTracking(input.carrier, input.trackingNumber);
  if (tracking.error) return { shipped: false, orderId, error: tracking.error };

  const result = await (prisma as any).$transaction(async (tx: any) => {
    const errors: string[] = [];
    await tx.$queryRawUnsafe('SELECT id FROM "Order" WHERE id = $1 FOR UPDATE', orderId);
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, shippingAddress: true, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!order) return { shipped: false, orderId, error: `Order ${orderId} was not found.` };
      if (order.status === "SHIPPED" || order.fulfillmentStatus === "SHIPPED" || order.shippedAt) {
        await tx.auditLog.create({ data: { actorAdminId: input.actor.demo ? null : input.actor.adminId, action: "SHIPMENT_SKIPPED_ALREADY_SHIPPED", entityType: "Order", entityId: order.id, note: "Shipment skipped because order was already shipped.", metadata: { actingUserEmail: input.actor.email, actingRole: input.actor.role, orderIds: [order.id], carrier: tracking.carrier, trackingNumber: tracking.trackingNumber } } });
        return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: `Order ${order.orderNumber} is already shipped.` };
      }
      if (order.status === "CANCELLED" || order.fulfillmentStatus === "BLOCKED") return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: `Order ${order.orderNumber} is cancelled or blocked and cannot be shipped.` };
      if (order.status !== "PAID") return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: `Order ${order.orderNumber} is unpaid and cannot be shipped. Payment must be collected before fulfillment release.` };
      if (order.fulfillmentStatus !== "PICKING") return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: `Order ${order.orderNumber} must be claimed and picking before shipment.` };
      if (order.assignedFulfillmentUserId !== input.actor.adminId) return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: `Order ${order.orderNumber} is not assigned to you.` };

      const itemStock: Array<{ item: any; inventory: any; reservation: any }> = [];
      for (const item of order.items) {
        const reservation = await tx.inventoryReservation.findFirst({ where: { orderItemId: item.id, status: "ACTIVE" } });
        const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (!inventory) errors.push(`Inventory is missing for ${order.orderNumber} / ${item.sku}.`);
        else if (!reservation || reservation.quantity < item.quantity) errors.push(`Active inventory reservation is missing for ${order.orderNumber} / ${item.sku}.`);
        else if (inventory.reserved < item.quantity) errors.push(`Reserved stock is lower than the order quantity for ${order.orderNumber} / ${item.sku}.`);
        else if (inventory.onHand < item.quantity) errors.push(`On-hand stock is lower than the order quantity for ${order.orderNumber} / ${item.sku}.`);
        if (!inventory || !reservation || reservation.quantity < item.quantity || inventory.reserved < item.quantity || inventory.onHand < item.quantity) continue;
        itemStock.push({ item, inventory, reservation });
      }
      if (itemStock.length !== order.items.length) return { shipped: false, orderId: order.id, orderNumber: order.orderNumber, error: errors.join(" ") };

      for (const { item, inventory } of itemStock) {
        await tx.inventory.update({ where: { id: inventory.id }, data: { reserved: { decrement: item.quantity }, onHand: { decrement: item.quantity }, transactions: { create: { type: "FULFILLMENT", quantity: item.quantity, reason: `Order ${order.orderNumber} shipped` } }, reservations: { updateMany: { where: { orderItemId: item.id, status: "ACTIVE" }, data: { status: "CONSUMED" } } } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "SHIPPED", fulfillmentStatus: "SHIPPED", carrier: tracking.carrier, trackingNumber: tracking.trackingNumber, shippedAt: new Date() } });
      await tx.auditLog.create({ data: { actorAdminId: input.actor.demo ? null : input.actor.adminId, action: "SHIPMENT_CONFIRMED", entityType: "Order", entityId: order.id, note: `Shipment confirmed for order ${order.orderNumber}.`, metadata: { orderNumber: order.orderNumber, actingUserEmail: input.actor.email, actingRole: input.actor.role, orderIds: [order.id], carrier: tracking.carrier, trackingNumber: tracking.trackingNumber } } });
      return { shipped: true, orderId: order.id, orderNumber: order.orderNumber, customerEmail: order.customerEmail };
  });

  if (result.shipped && result.orderId && result.customerEmail) {
    const trackingUrl = buildTrackingUrl(tracking.carrier, tracking.trackingNumber) || "";
    const order = await (prisma as any).order.findUnique({ where: { id: result.orderId }, include: { items: true, shippingAddress: true, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (order) await sendCustomerOrderTemplate("CUSTOMER_SHIPMENT", order, { trackingUrl }).catch(() => undefined);
  }
  return result;
}
