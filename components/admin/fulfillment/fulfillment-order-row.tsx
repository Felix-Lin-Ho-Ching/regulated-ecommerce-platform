import Link from "next/link";
import type { AdminSession } from "@/lib/admin/auth";
import type { FulfillmentOrderForAdmin } from "@/lib/fulfillment/admin-queries";
import { StatusBadge } from "@/components/ui";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatusTone(status: string) {
  if (status === "SHIPPED") return "success";
  if (status === "BLOCKED") return "danger";
  return "warning";
}

export function FulfillmentOrderRow({ admin, order }: { admin: AdminSession; order: FulfillmentOrderForAdmin }) {
  const canShip = order.status === "PAID" && order.fulfillmentStatus !== "SHIPPED" && (admin.role !== "FULFILLMENT" || order.assignedFulfillmentUserId === admin.adminId);
  const customerName = order.customerName || order.shippingAddress?.name || "—";
  const customerEmail = order.customerEmail || "—";
  const shipTo = order.shippingAddress ? `${order.shippingAddress.state} ${order.shippingAddress.postalCode}` : "—";
  const assignedEmployee = order.assignedFulfillmentUser?.name || order.assignedFulfillmentUser?.email || "Unassigned";
  const skuList = order.items.map((item) => item.sku).join(", ");
  const quantityTotal = order.items.reduce((total, item) => total + item.quantity, 0);
  const hasRestrictedItem = order.items.some((item) => item.restricted);

  return (
    <tr>
      <td>{canShip ? <input type="checkbox" name="orderIds" value={order.id} /> : null}</td>
      <td className="font-bold"><Link className="text-teal-900 underline" href={`/admin/orders/${order.orderNumber}`}>{order.orderNumber}</Link><br /><Link className="text-xs font-bold text-slate-600 underline" href={`/admin/fulfillment/${order.id}/pick-pack`}>Pick/pack</Link></td>
      <td>{customerName}<br /><span className="text-xs text-slate-600">{customerEmail}</span></td>
      <td>{shipTo}</td>
      <td>{hasRestrictedItem ? "Yes" : "No"}</td>
      <td>{order.items.length}</td>
      <td className="max-w-xs text-xs">{skuList || "—"}</td>
      <td>{quantityTotal}</td>
      <td><StatusBadge tone={getStatusTone(order.fulfillmentStatus)}>{order.fulfillmentStatus}</StatusBadge></td>
      <td>{assignedEmployee}</td>
      <td>{formatDate(order.createdAt)}</td>
      <td>{formatDate(order.shippedAt)}</td>
      <td>{order.carrier || order.trackingNumber ? `${order.carrier || "—"} / ${order.trackingNumber || "—"}` : "—"}</td>
    </tr>
  );
}
