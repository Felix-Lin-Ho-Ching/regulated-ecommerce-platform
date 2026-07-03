import { revalidatePath } from "next/cache";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-service";
import { optionalAuditNote, reasonRequiredMessage, validateManualReason } from "@/lib/admin/action-state";
import { logDebugEmail } from "@/lib/email/email-log-service";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildAdminNewOrderEmail } from "@/lib/email/templates/admin-new-order";
import { releaseOrderAfterPaymentApproval } from "@/lib/orders/order-service";

export const adminOrderStatuses = ["ORDER_REQUEST_SUBMITTED", "AUTO_ELIGIBLE", "PENDING_PAYMENT", "FULFILLMENT_HOLD", "PENDING_ELIGIBILITY", "READY_FOR_PAYMENT", "PAID", "FULFILLED", "SHIPPED", "CANCELLED", "BLOCKED"] as const;
export type AdminOrderStatus = (typeof adminOrderStatuses)[number];
export const terminalAdminOrderStatuses = ["CANCELLED", "SHIPPED", "FULFILLED", "BLOCKED"] as const;
export function isTerminalAdminOrderStatus(status: string) { return (terminalAdminOrderStatuses as readonly string[]).includes(status); }
export type AdminOrderFilters = { orderNumber?: string; customerEmail?: string; customerName?: string; status?: string; payment?: string; restricted?: string; state?: string; postalCode?: string; createdFrom?: string; createdTo?: string };

function clean(value?: string) { return value?.trim() || undefined; }
function dateAtStart(value?: string) { const v = clean(value); if (!v) return undefined; const d = new Date(`${v}T00:00:00.000Z`); return Number.isNaN(d.getTime()) ? undefined : d; }
function dateAtEnd(value?: string) { const v = clean(value); if (!v) return undefined; const d = new Date(`${v}T23:59:59.999Z`); return Number.isNaN(d.getTime()) ? undefined : d; }
function hasRestricted(order: any) { return order.items.some((item: any) => item.product?.restricted); }
function customerEmail(order: any) { return order.customerEmail ?? order.user?.email ?? ""; }

export async function getAdminOrders(filters: AdminOrderFilters = {}) {
  if (!isDatabaseConfigured) return { available: false as const, orders: [] };
  const createdFrom = dateAtStart(filters.createdFrom);
  const createdTo = dateAtEnd(filters.createdTo);
  const where: any = { archivedAt: null, AND: [] };
  if (clean(filters.orderNumber)) where.orderNumber = { contains: clean(filters.orderNumber), mode: "insensitive" };
  if (clean(filters.customerEmail)) where.AND.push({ OR: [{ customerEmail: { contains: clean(filters.customerEmail), mode: "insensitive" } }, { user: { email: { contains: clean(filters.customerEmail), mode: "insensitive" } } }] });
  if (clean(filters.customerName)) where.AND.push({ OR: [{ customerName: { contains: clean(filters.customerName), mode: "insensitive" } }, { shippingAddress: { name: { contains: clean(filters.customerName), mode: "insensitive" } } }, { user: { name: { contains: clean(filters.customerName), mode: "insensitive" } } }] });
  if (clean(filters.status)) where.status = filters.status;
  if (clean(filters.payment)) where.AND.push({ OR: [{ paymentMode: { contains: clean(filters.payment), mode: "insensitive" } }, { paymentAttempts: { some: { status: filters.payment } } }, { paymentAttempts: { some: { provider: filters.payment } } }] });
  if (clean(filters.state)) where.shippingAddress = { ...(where.shippingAddress ?? {}), state: { equals: clean(filters.state)?.toUpperCase() } };
  if (clean(filters.postalCode)) where.shippingAddress = { ...(where.shippingAddress ?? {}), postalCode: { contains: clean(filters.postalCode), mode: "insensitive" } };
  if (createdFrom || createdTo) where.createdAt = { ...(createdFrom ? { gte: createdFrom } : {}), ...(createdTo ? { lte: createdTo } : {}) };
  if (filters.restricted === "yes") where.items = { some: { product: { restricted: true } } };
  if (filters.restricted === "no") where.items = { none: { product: { restricted: true } } };
  if (!where.AND.length) delete where.AND;
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, name: true } }, shippingAddress: true, items: { include: { product: { select: { restricted: true } }, variant: { include: { inventory: { include: { reservations: true } } } } } }, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return { available: true as const, orders };
}

export async function getAdminOrder(idOrNumber: string) {
  if (!isDatabaseConfigured) return { available: false as const, order: null };
  const order = await prisma.order.findFirst({ where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }], archivedAt: null }, include: { user: { select: { email: true, name: true } }, shippingAddress: true, items: { include: { product: { select: { restricted: true } }, variant: { include: { inventory: { include: { reservations: { orderBy: { createdAt: "desc" } } } } } } } }, paymentAttempts: { orderBy: { createdAt: "desc" } }, verificationSnapshot: true, emailLogs: { orderBy: { createdAt: "desc" } }, fulfillmentTokens: { orderBy: { createdAt: "desc" } } } });
  if (!order) return { available: true as const, order: null, auditLogs: [] };
  const auditLogs = await prisma.auditLog.findMany({ where: { entityType: "Order", entityId: order.id }, orderBy: { createdAt: "desc" } });
  return { available: true as const, order, auditLogs };
}

export async function updateAdminOrderStatus(orderId: string, status: string, note: string): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  if (!orderId) return { error: "Missing order id." };
  if (["SHIPPED", "PAID", "FULFILLED"].includes(status)) return { error: "Unsafe action blocked: unpaid order requests cannot be marked paid, shipped, or fulfilled manually." };
  if (status === "CANCELLED") return { error: "Unsafe action blocked: use the dedicated cancellation form so inventory reservations and cancellation notices are handled safely." };
  if (status === "BLOCKED") return { error: "Unsafe action blocked: blocked checkout must stop before order creation and cannot be applied through the generic status form." };
  if (!adminOrderStatuses.includes(status as AdminOrderStatus)) return { error: "Invalid order status." };
  const noteResult = { note: optionalAuditNote(note, `Owner changed order status to ${status}.`) };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, status: true, fulfillmentStatus: true, shippedAt: true } });
  if (!order) return { error: "Order was not found." };
  if (isTerminalAdminOrderStatus(order.status)) return { error: "Generic status updates are blocked for terminal orders. Use the appropriate dedicated workflow instead." };
  if (order.fulfillmentStatus === "SHIPPED" || order.shippedAt) return { error: "Generic status updates are blocked for orders that have shipped. Return/refund workflow is separate." };
  await prisma.order.update({ where: { id: orderId }, data: { status }, select: { id: true } });
  await createAuditLog({ action: "UPDATE", entityType: "Order", entityId: order.id, note: noteResult.note, metadata: { status } });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${order.orderNumber}`); return {};
}

export async function addInternalOrderNote(orderId: string, note: string): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const text = note.trim(); if (!text) return { error: "Internal note cannot be empty." };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true } });
  if (!order) return { error: "Order was not found." };
  await createAuditLog({ action: "UPDATE", entityType: "Order", entityId: order.id, note: text, metadata: { internalNote: true } });
  revalidatePath(`/admin/orders/${order.orderNumber}`); return {};
}

export async function logOrderNotification(orderId: string, type: "customer_confirmation" | "admin_new_order" | "customer_cancellation"): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const order: any = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } }, shippingAddress: true, items: { include: { product: { select: { restricted: true } } } } } });
  if (!order) return { error: "Order was not found." };
  if (type === "customer_cancellation" && order.status !== "CANCELLED") return { error: "Cancellation notices can only be logged after cancellation." };
  if (type === "customer_confirmation") {
    const msg = buildOrderConfirmationEmail({ orderNumber: order.orderNumber, createdAt: order.createdAt, items: order.items, totalCents: order.totalCents, shippingAddress: order.shippingAddress, hasRestrictedItems: hasRestricted(order) });
    await logDebugEmail({ type: "ORDER_REQUEST_CONFIRMATION", to: customerEmail(order), subject: msg.subject, text: msg.text, orderId: order.id, metadata: { orderNumber: order.orderNumber, regeneratedByAdmin: true } });
  } else if (type === "admin_new_order") {
    const msg = buildAdminNewOrderEmail({ orderNumber: order.orderNumber, customerEmail: customerEmail(order), totalCents: order.totalCents, hasRestrictedItems: hasRestricted(order), shippingState: order.shippingAddress?.state, shippingPostalCode: order.shippingAddress?.postalCode, adminOrderUrl: `/admin/orders/${order.orderNumber}` });
    await logDebugEmail({ type: "ADMIN_NEW_ORDER", to: process.env.ADMIN_ORDER_EMAIL || process.env.ADMIN_EMAIL || "linhochingfelix@gmail.com", subject: msg.subject, text: msg.text, orderId: order.id, metadata: { orderNumber: order.orderNumber, regeneratedByAdmin: true } });
  } else {
    await logDebugEmail({ type: "CUSTOMER_CANCELLATION", to: customerEmail(order), subject: `Order request ${order.orderNumber} cancelled`, text: `Your order request ${order.orderNumber} has been cancelled. Payment not collected. Fulfillment not released. No shipment has started.`, orderId: order.id, metadata: { orderNumber: order.orderNumber, regeneratedByAdmin: true } });
  }
  await createAuditLog({ action: "UPDATE", entityType: "Order", entityId: order.id, note: `Admin regenerated/logged ${type.replaceAll("_", " ")} message.`, metadata: { emailAction: type } });
  revalidatePath(`/admin/orders/${order.orderNumber}`); return {};
}

export async function cancelOrderBeforeShipment(orderId: string, note: string): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const noteResult = validateManualReason(note); if ("error" in noteResult) return { error: reasonRequiredMessage };
  const order: any = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } }, items: true } });
  if (!order) return { error: "Order was not found." };
  if (order.status === "SHIPPED" || order.fulfillmentStatus === "SHIPPED" || order.shippedAt) return { error: "This order is already shipped. Return/refund workflow is separate." };
  if (order.status === "FULFILLED") return { error: "This order is already fulfilled." };
  if (order.status === "CANCELLED") return { error: "This order is already cancelled." };
  await (prisma as any).$transaction(async (tx: any) => {
    for (const item of order.items) {
      const reservations = await tx.inventoryReservation.findMany({ where: { orderItemId: item.id, status: "ACTIVE" } });
      const releaseQty = reservations.reduce((sum: number, r: any) => sum + r.quantity, 0);
      if (releaseQty > 0) await tx.inventory.update({ where: { variantId: item.variantId }, data: { reserved: { decrement: releaseQty }, transactions: { create: { type: "RELEASE_RESERVATION", quantity: releaseQty, reason: `Order ${order.orderNumber} cancelled` } } } });
      await tx.inventoryReservation.updateMany({ where: { orderItemId: item.id, status: "ACTIVE" }, data: { status: "RELEASED" } });
    }
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", fulfillmentStatus: "FULFILLMENT_HOLD" } });
    await tx.auditLog.create({ data: { action: "UPDATE", entityType: "Order", entityId: order.id, note: noteResult.note, metadata: { status: "CANCELLED", inventoryReservationsReleased: true, fulfillmentReleased: false } } });
  });
  await logDebugEmail({ type: "CUSTOMER_CANCELLATION", to: customerEmail(order), subject: `Order request ${order.orderNumber} cancelled`, text: `Your order request ${order.orderNumber} has been cancelled. Payment not collected. Fulfillment not released. No shipment has started.`, orderId: order.id, metadata: { orderNumber: order.orderNumber } }).catch(() => undefined);
  await logDebugEmail({ type: "ADMIN_CANCELLATION", to: process.env.ADMIN_ORDER_EMAIL || process.env.ADMIN_EMAIL || "linhochingfelix@gmail.com", subject: `Order request ${order.orderNumber} cancelled`, text: `Order request ${order.orderNumber} was cancelled by admin. Payment not collected. Fulfillment not released. Active inventory reservations were released internally.`, orderId: order.id, metadata: { orderNumber: order.orderNumber } }).catch(() => undefined);
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${order.orderNumber}`); return {};
}

export async function simulateAdminPaymentApproved(orderId: string): Promise<{ error?: string }> {
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, status: true, fulfillmentStatus: true, shippedAt: true } });
  if (!order) return { error: "Order was not found." };
  if (order.shippedAt || order.fulfillmentStatus === "SHIPPED") return { error: "Shipped orders cannot be payment-simulated." };
  if (!["READY_FOR_PAYMENT", "PENDING_PAYMENT", "PAYMENT_FAILED", "ORDER_REQUEST_SUBMITTED", "AUTO_ELIGIBLE"].includes(order.status) || order.fulfillmentStatus !== "FULFILLMENT_HOLD") {
    return { error: "Only unreleased READY_FOR_PAYMENT / FULFILLMENT_HOLD order-request orders can be simulated." };
  }
  await releaseOrderAfterPaymentApproval(order.id, { email: "admin-payment-simulator", role: "ADMIN" });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${order.orderNumber}`); revalidatePath("/admin/fulfillment");
  return {};
}
