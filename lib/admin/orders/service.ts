import { revalidatePath } from "next/cache";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";

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

export async function updateAdminOrderStatus(orderId: string, status: string, note: string) {
  if (!isDatabaseConfigured) throw new Error("Database is not configured.");
  if (!adminOrderStatuses.includes(status as AdminOrderStatus)) throw new Error("Invalid order status.");
  const auditNote = requireAuditNote(note, "Order status update");
  const order = await prisma.order.update({ where: { id: orderId }, data: { status }, select: { id: true, orderNumber: true, status: true } });
  await createAuditLog({ action: "UPDATE", entityType: "Order", entityId: order.id, note: auditNote, metadata: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.orderNumber}`);
}
