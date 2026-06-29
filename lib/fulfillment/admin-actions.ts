"use server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { shipOrders } from "@/lib/fulfillment/ship-orders";

export type FulfillmentFormState = { error?: string; success?: string };
export type FulfillmentSettingsForAdmin = {
  defaultBatchSize: number;
  maxBatchSize: number;
  allowCustomClaim: boolean;
};

export async function getFulfillmentSettings(): Promise<FulfillmentSettingsForAdmin> {
  return (prisma as any).fulfillmentSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultBatchSize: 25, maxBatchSize: 100, allowCustomClaim: false } });
}
export async function updateFulfillmentSettingsAction(_s: FulfillmentFormState, fd: FormData): Promise<FulfillmentFormState> {
  const actor = await requireAdminSession("/admin/fulfillment");
  if (!["OWNER", "ADMIN"].includes(actor.role)) return { error: "Only owner/admin can edit fulfillment settings." };
  const defaultBatchSize = Number(fd.get("defaultBatchSize"));
  const maxBatchSize = Number(fd.get("maxBatchSize"));
  const allowCustomClaim = fd.get("allowCustomClaim") === "on";
  if (!Number.isInteger(maxBatchSize) || maxBatchSize < 1 || maxBatchSize > 200) return { error: "Maximum batch size must be between 1 and 200." };
  if (!Number.isInteger(defaultBatchSize) || defaultBatchSize < 1 || defaultBatchSize > maxBatchSize) return { error: "Default batch size must be between 1 and maximum batch size." };
  const old = await getFulfillmentSettings();
  await (prisma as any).fulfillmentSettings.update({ where: { id: "default" }, data: { defaultBatchSize, maxBatchSize, allowCustomClaim } });
  await (prisma as any).auditLog.create({ data: { actorAdminId: actor.demo ? null : actor.adminId, action: "FULFILLMENT_SETTINGS_UPDATED", entityType: "FulfillmentSettings", entityId: "default", note: "Fulfillment settings updated.", metadata: { actingUserEmail: actor.email, actingRole: actor.role, oldSettingValue: old, newSettingValue: { defaultBatchSize, maxBatchSize, allowCustomClaim } } } });
  revalidatePath("/admin/fulfillment");
  return { success: "Fulfillment settings saved." };
}
export async function claimBatchAction(_s: FulfillmentFormState, fd: FormData): Promise<FulfillmentFormState> {
  const actor = await requireAdminSession("/admin/fulfillment");
  if (!["OWNER", "ADMIN", "FULFILLMENT"].includes(actor.role)) return { error: "You cannot claim fulfillment orders." };
  const settings = await getFulfillmentSettings();
  const requested = fd.get("claimSize") ? Number(fd.get("claimSize")) : settings.defaultBatchSize;
  const claimSize = settings.allowCustomClaim ? Math.min(Math.max(1, requested || settings.defaultBatchSize), settings.maxBatchSize) : settings.defaultBatchSize;
  const claimed = await (prisma as any).$transaction(async (tx: any) => {
    const rows: Array<{ id: string }> = await tx.$queryRawUnsafe(`SELECT o.id FROM "Order" o WHERE o."assignedFulfillmentUserId" IS NULL AND o."fulfillmentStatus" = 'READY_TO_SHIP' AND o.status = 'PAID' AND o."shippedAt" IS NULL AND EXISTS (SELECT 1 FROM "OrderItem" i JOIN "InventoryReservation" r ON r."orderItemId" = i.id AND r.status = 'ACTIVE' WHERE i."orderId" = o.id) ORDER BY o."createdAt" ASC LIMIT $1 FOR UPDATE SKIP LOCKED`, claimSize);
    const ids = rows.map((r) => r.id);
    if (!ids.length) return [];
    await tx.order.updateMany({ where: { id: { in: ids }, assignedFulfillmentUserId: null, fulfillmentStatus: "READY_TO_SHIP" }, data: { assignedFulfillmentUserId: actor.adminId, fulfillmentStatus: "PICKING", assignedAt: new Date() } });
    await Promise.all(ids.map((id: string) => tx.auditLog.create({ data: { actorAdminId: actor.demo ? null : actor.adminId, action: "ORDER_ASSIGNED", entityType: "Order", entityId: id, note: "Order assigned by automatic fulfillment claim.", metadata: { actingUserEmail: actor.email, actingRole: actor.role, claimedBy: actor.email, claimedOrderId: id, orderIds: [id], batchSize: claimSize } } })));
    await tx.auditLog.create({ data: { actorAdminId: actor.demo ? null : actor.adminId, action: "FULFILLMENT_BATCH_CLAIMED", entityType: "Order", entityId: ids[0], note: "Fulfillment batch claimed.", metadata: { actingUserEmail: actor.email, actingRole: actor.role, orderIds: ids, batchSize: claimSize } } });
    return ids;
  });
  revalidatePath("/admin/fulfillment");
  return { success: claimed.length ? `Claimed ${claimed.length} order(s).` : "No ready-to-ship orders are available." };
}

export async function claimOrderFormAction(fd: FormData): Promise<void> {
  await claimOrderAction({}, fd);
}

export async function claimOrderAction(_s: FulfillmentFormState, fd: FormData): Promise<FulfillmentFormState> {
  const actor = await requireAdminSession("/admin/fulfillment");
  if (!["OWNER", "ADMIN", "FULFILLMENT"].includes(actor.role)) return { error: "You cannot claim fulfillment orders." };
  const orderId = String(fd.get("orderId") || "");
  if (!orderId) return { error: "Select an order to claim." };
  const claimed = await (prisma as any).$transaction(async (tx: any) => {
    await tx.$queryRawUnsafe('SELECT id FROM "Order" WHERE id = $1 FOR UPDATE', orderId);
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, status: true, fulfillmentStatus: true, assignedFulfillmentUserId: true, shippedAt: true } });
    if (!order) return { error: "Order not found." };
    if (order.status !== "PAID" || order.fulfillmentStatus !== "READY_TO_SHIP" || order.shippedAt) return { error: `Order ${order.orderNumber} is not ready to claim.` };
    if (order.assignedFulfillmentUserId && order.assignedFulfillmentUserId !== actor.adminId) return { error: `Order ${order.orderNumber} is already claimed by another staff user.` };
    await tx.order.update({ where: { id: order.id }, data: { fulfillmentStatus: "PICKING", assignedFulfillmentUserId: actor.adminId, assignedAt: new Date() } });
    await tx.auditLog.create({ data: { actorAdminId: actor.demo ? null : actor.adminId, action: "UPDATE", entityType: "Order", entityId: order.id, note: `Fulfillment claimed for order ${order.orderNumber}.`, metadata: { action: "FULFILLMENT_CLAIMED", orderNumber: order.orderNumber, staffUserId: actor.adminId, actingUserEmail: actor.email, actingRole: actor.role } } });
    return { success: `Claimed ${order.orderNumber}.` };
  });
  revalidatePath("/admin/fulfillment");
  return claimed;
}

export async function markSelectedShippedAction(_s: FulfillmentFormState, fd: FormData): Promise<FulfillmentFormState> {
  const actor = await requireAdminSession("/admin/fulfillment");
  const orderIds = fd.getAll("orderIds").map(String);
  const result = await shipOrders({ orderIds, actor, carrier: String(fd.get("carrier") || "").trim() || undefined, trackingNumber: String(fd.get("trackingNumber") || "").trim() || undefined });
  revalidatePath("/admin/fulfillment");
  if (result.errors.length && !result.shipped.length) return { error: result.errors.join(" ") };
  return { success: `Shipped ${result.shipped.length} order(s). Skipped ${result.skipped.length}. ${result.errors.join(" ")}`.trim() };
}
