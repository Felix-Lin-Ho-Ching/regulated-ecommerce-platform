import { revalidatePath } from "next/cache";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-service";
import { optionalAuditNote, reasonRequiredMessage, validateManualReason } from "@/lib/admin/action-state";

export const adminOrderStatuses = ["FULFILLMENT_HOLD", "PENDING_ELIGIBILITY", "READY_FOR_PAYMENT", "PAID", "FULFILLED", "CANCELLED", "BLOCKED"] as const;
export type AdminOrderStatus = (typeof adminOrderStatuses)[number];

export async function getAdminOrders() {
  if (!isDatabaseConfigured) return { available: false as const, orders: [] };
  const orders = await prisma.order.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, name: true } }, shippingAddress: true, items: { include: { product: { select: { restricted: true } } } }, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return { available: true as const, orders };
}

export async function getAdminOrder(idOrNumber: string) {
  if (!isDatabaseConfigured) return { available: false as const, order: null };
  const order = await prisma.order.findFirst({ where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }], archivedAt: null }, include: { user: { select: { email: true, name: true } }, shippingAddress: true, items: { include: { product: { select: { restricted: true } } } }, paymentAttempts: { orderBy: { createdAt: "desc" } }, verificationSnapshot: true, emailLogs: { orderBy: { createdAt: "desc" } } } });
  if (!order) return { available: true as const, order: null, auditLogs: [] };
  const auditLogs = await prisma.auditLog.findMany({ where: { entityType: "Order", entityId: order.id }, orderBy: { createdAt: "desc" } });
  return { available: true as const, order, auditLogs };
}

export async function updateAdminOrderStatus(orderId: string, status: string, note: string): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  if (!orderId) return { error: "Missing order id." };
  if (!adminOrderStatuses.includes(status as AdminOrderStatus)) return { error: "Invalid order status." };

  const highRisk = status === "CANCELLED" || status === "BLOCKED";
  const noteResult = highRisk ? validateManualReason(note) : { note: optionalAuditNote(note, `Owner changed order status to ${status}.`) };
  if ("error" in noteResult) return { error: reasonRequiredMessage };

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true } });
  if (!order) return { error: "Order was not found." };

  await prisma.order.update({ where: { id: orderId }, data: { status }, select: { id: true, orderNumber: true, status: true } });
  await createAuditLog({ action: "UPDATE", entityType: "Order", entityId: order.id, note: noteResult.note, metadata: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.orderNumber}`);
  return {};
}
