import { prisma } from "@/lib/db/prisma";
import { logDebugEmail } from "@/lib/email/email-log-service";
import type { AdminSession } from "@/lib/admin/auth";
import { buildTrackingUrl } from "@/lib/orders/order-service";

export type ShipOrdersInput = { orderIds: string[]; actor: AdminSession; carrier?: string; trackingNumber?: string };
export type ShipOrdersResult = { shipped: string[]; skipped: string[]; errors: string[] };

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
  const orderIds = Array.from(new Set(input.orderIds.filter(Boolean)));
  if (!orderIds.length) return { shipped: [], skipped: [], errors: ["Select at least one order."] };
  const tracking = validateShipmentTracking(input.carrier, input.trackingNumber);
  if (tracking.error) return { shipped: [], skipped: [], errors: [tracking.error] };

  const result = await (prisma as any).$transaction(async (tx: any) => {
    const shipped: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const orderId of orderIds) {
      await tx.$queryRawUnsafe('SELECT id FROM "Order" WHERE id = $1 FOR UPDATE', orderId);
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) { errors.push(`Order ${orderId} was not found.`); continue; }
      if (order.status === "SHIPPED" || order.fulfillmentStatus === "SHIPPED" || order.shippedAt) {
        skipped.push(order.id);
        await tx.auditLog.create({ data: { actorAdminId: input.actor.demo ? null : input.actor.adminId, action: "SHIPMENT_SKIPPED_ALREADY_SHIPPED", entityType: "Order", entityId: order.id, note: "Shipment skipped because order was already shipped.", metadata: { actingUserEmail: input.actor.email, actingRole: input.actor.role, orderIds: [order.id], carrier: tracking.carrier, trackingNumber: tracking.trackingNumber } } });
        continue;
      }
      if (order.status === "CANCELLED" || order.fulfillmentStatus === "BLOCKED") { errors.push(`Order ${order.orderNumber} is cancelled or blocked and cannot be shipped.`); continue; }
      if (order.status !== "PAID") { errors.push(`Order ${order.orderNumber} is unpaid and cannot be shipped. Payment must be collected before fulfillment release.`); continue; }
      if (order.fulfillmentStatus !== "PICKING") { errors.push(`Order ${order.orderNumber} must be claimed and picking before shipment.`); continue; }
      if (order.assignedFulfillmentUserId !== input.actor.adminId) { errors.push(`Order ${order.orderNumber} is not assigned to you.`); continue; }

      const itemStock: Array<{ item: any; inventory: any; reservation: any }> = [];
      for (const item of order.items) {
        const reservation = await tx.inventoryReservation.findFirst({ where: { orderItemId: item.id, status: "ACTIVE" } });
        const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (!inventory) { errors.push(`Inventory is missing for ${order.orderNumber} / ${item.sku}.`); continue; }
        if (!reservation || reservation.quantity < item.quantity) { errors.push(`Active inventory reservation is missing for ${order.orderNumber} / ${item.sku}.`); continue; }
        if (inventory.reserved < item.quantity) { errors.push(`Reserved stock is lower than the order quantity for ${order.orderNumber} / ${item.sku}.`); continue; }
        if (inventory.onHand < item.quantity) { errors.push(`On-hand stock is lower than the order quantity for ${order.orderNumber} / ${item.sku}.`); continue; }
        itemStock.push({ item, inventory, reservation });
      }
      if (itemStock.length !== order.items.length) continue;

      for (const { item, inventory } of itemStock) {
        await tx.inventory.update({ where: { id: inventory.id }, data: { reserved: { decrement: item.quantity }, onHand: { decrement: item.quantity }, transactions: { create: { type: "FULFILLMENT", quantity: item.quantity, reason: `Order ${order.orderNumber} shipped` } }, reservations: { updateMany: { where: { orderItemId: item.id, status: "ACTIVE" }, data: { status: "CONSUMED" } } } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "SHIPPED", fulfillmentStatus: "SHIPPED", carrier: tracking.carrier, trackingNumber: tracking.trackingNumber, shippedAt: new Date() } });
      await tx.auditLog.create({ data: { actorAdminId: input.actor.demo ? null : input.actor.adminId, action: "SHIPMENT_CONFIRMED", entityType: "Order", entityId: order.id, note: `Shipment confirmed via ${tracking.carrier} tracking ${tracking.trackingNumber}.`, metadata: { actingUserEmail: input.actor.email, actingRole: input.actor.role, orderIds: [order.id], carrier: tracking.carrier, trackingNumber: tracking.trackingNumber } } });
      shipped.push(order.id);
    }
    if (shipped.length) await tx.auditLog.create({ data: { actorAdminId: input.actor.demo ? null : input.actor.adminId, action: "BATCH_SHIPMENT_CONFIRMED", entityType: "Order", entityId: shipped[0], note: "Batch shipment confirmed.", metadata: { actingUserEmail: input.actor.email, actingRole: input.actor.role, orderIds: shipped, batchSize: shipped.length, carrier: tracking.carrier, trackingNumber: tracking.trackingNumber } } });
    return { shipped, skipped, errors };
  });

  if (result.shipped.length) {
    const orders = await (prisma as any).order.findMany({ where: { id: { in: result.shipped } }, select: { id: true, orderNumber: true, customerEmail: true } });
    await Promise.all(orders.filter((o: any) => o.customerEmail).map((o: any) => logDebugEmail({ type: "CUSTOMER_SHIPMENT", to: o.customerEmail, subject: `Order ${o.orderNumber} shipped`, text: `Your order ${o.orderNumber} has shipped. Carrier: ${tracking.carrier}. Tracking number: ${tracking.trackingNumber}.${buildTrackingUrl(tracking.carrier, tracking.trackingNumber) ? ` Track: ${buildTrackingUrl(tracking.carrier, tracking.trackingNumber)}.` : ""}`, orderId: o.id, metadata: { orderNumber: o.orderNumber, carrier: tracking.carrier, trackingNumber: tracking.trackingNumber, trackingUrl: buildTrackingUrl(tracking.carrier, tracking.trackingNumber) } }).catch(() => undefined)));
  }
  return result;
}
