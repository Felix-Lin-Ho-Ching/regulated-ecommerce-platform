"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { logDebugEmail } from "@/lib/email/email-log-service";
import { hashFulfillmentToken } from "@/lib/fulfillment/tokens";

export type FulfillmentActionState = { error?: string; success?: string; alreadyShipped?: boolean };

export async function confirmShipmentAction(_state: FulfillmentActionState, formData: FormData): Promise<FulfillmentActionState> {
  const token = String(formData.get("token") || "");
  const carrier = String(formData.get("carrier") || "").trim() || undefined;
  const trackingNumber = String(formData.get("trackingNumber") || "").trim() || undefined;
  if (!token) return { error: "Missing fulfillment token." };
  const tokenHash = hashFulfillmentToken(token);

  const result = await (prisma as any).$transaction(async (tx: any) => {
    const fulfillmentToken = await tx.fulfillmentToken.findUnique({ where: { tokenHash }, include: { order: { include: { items: true } } } });
    if (!fulfillmentToken) return { error: "This fulfillment link is invalid." };
    if (fulfillmentToken.order.status === "SHIPPED" || fulfillmentToken.usedAt) return { alreadyShipped: true };
    if (fulfillmentToken.expiresAt < new Date()) return { error: "This fulfillment link has expired." };
    const order = fulfillmentToken.order;
    if (!["ORDER_REQUEST_SUBMITTED", "AUTO_ELIGIBLE", "PENDING_PAYMENT", "FULFILLMENT_HOLD", "READY_FOR_PAYMENT"].includes(order.status)) return { error: "This order is not eligible for shipment confirmation." };

    for (const item of order.items) {
      const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
      if (!inventory) return { error: `Inventory is missing for ${item.sku}.` };
      if (inventory.reserved < item.quantity) return { error: `Reserved stock is lower than the order quantity for ${item.sku}.` };
      if (inventory.onHand < item.quantity) return { error: `On-hand stock is lower than the order quantity for ${item.sku}.` };
      await tx.inventory.update({ where: { id: inventory.id }, data: { reserved: { decrement: item.quantity }, onHand: { decrement: item.quantity }, transactions: { create: { type: "FULFILLMENT", quantity: item.quantity, reason: `Order ${order.orderNumber} shipped` } }, reservations: { updateMany: { where: { orderItemId: item.id, status: "ACTIVE" }, data: { status: "CONSUMED" } } } } });
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "SHIPPED", carrier, trackingNumber, shippedAt: new Date() } });
    await tx.fulfillmentToken.update({ where: { id: fulfillmentToken.id }, data: { usedAt: new Date() } });
    await tx.auditLog.create({ data: { action: "UPDATE", entityType: "Order", entityId: order.id, note: "Shipment confirmed from secure fulfillment link.", metadata: { carrier, trackingNumber } } });
    return { orderId: order.id, orderNumber: order.orderNumber, customerEmail: order.customerEmail };
  });

  if (result.error) return { error: result.error };
  if (result.alreadyShipped) return { alreadyShipped: true, success: "Already shipped" };
  if (result.customerEmail) await logDebugEmail({ type: "CUSTOMER_SHIPMENT", to: result.customerEmail, subject: `Order ${result.orderNumber} shipped`, text: `Your order ${result.orderNumber} has been marked shipped.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`, orderId: result.orderId, metadata: { orderNumber: result.orderNumber, carrier, trackingNumber } }).catch(() => undefined);
  revalidatePath(`/fulfillment/ship/${token}`);
  return { success: "Shipment confirmed." };
}
