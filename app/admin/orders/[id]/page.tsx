import Link from "next/link";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { adminOrderStatuses, getAdminOrder } from "@/lib/admin/orders/service";
import { OrderStatusForm } from "@/components/admin/orders/order-status-form";
import { CancelOrderForm } from "@/components/admin/orders/cancel-order-form";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result.available) return <AdminShell title="Order"><EmptyState title="Database unavailable">Order detail requires DATABASE_URL.</EmptyState></AdminShell>;
  if (!result.order) return <AdminShell title="Order not found"><EmptyState title="Order not found">This order could not be found. <Link className="font-bold text-teal-900 underline" href="/admin/orders">Back to orders</Link></EmptyState></AdminShell>;
  const order: any = result.order;
  const address = order.shippingAddress;
  const restricted = order.items.some((item: any) => item.product.restricted);
  return <AdminShell title={`Order ${order.orderNumber}`}>
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <section className="card p-5">
        <SectionHeader eyebrow="Order detail" title={order.orderNumber}>Created {fmt(order.createdAt)}</SectionHeader>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <p><b>Status:</b> <StatusBadge tone="warning">{order.status}</StatusBadge></p><p><b>Order-request mode:</b> {order.paymentMode ?? "order_request"}</p>
          <p><b>Payment:</b> Not collected · {order.paymentAttempts[0]?.provider ?? "ORDER_REQUEST"}/{order.paymentAttempts[0]?.status ?? "ORDER_REQUEST"}</p><p><b>Restricted item:</b> {restricted ? "Yes" : "No"}</p>
          <p><b>Email:</b> {order.customerEmail ?? order.user?.email ?? "—"}</p><p><b>Name:</b> {order.customerName ?? address?.name ?? order.user?.name ?? "—"}</p>
          <p><b>Phone:</b> {order.customerPhone ?? address?.phone ?? "—"}</p><p><b>State/ZIP:</b> {address?.state ?? "—"} {address?.postalCode ?? "—"}</p><p><b>Eligibility result:</b> {order.eligibilityResult ?? "—"}</p><p><b>Shipment:</b> {order.shippedAt ? `Shipped ${fmt(order.shippedAt)}` : "Not shipped"} {order.trackingNumber ? `· ${order.carrier || "Carrier"} ${order.trackingNumber}` : ""}</p>
          <p className="md:col-span-2"><b>Shipping:</b> {[address?.name, address?.line1, address?.line2, `${address?.city ?? ""}, ${address?.state ?? ""} ${address?.postalCode ?? ""}`, address?.country].filter(Boolean).join(", ")}</p>
        </div>
      </section>
<div><OrderStatusForm orderId={order.id} orderNumber={order.orderNumber} currentStatus={order.status} statuses={adminOrderStatuses} />{order.status !== "SHIPPED" && order.status !== "CANCELLED" ? <CancelOrderForm orderId={order.id} /> : null}</div>
    </div>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Items / reservation state</h2><p className="mb-3 text-sm text-slate-600">Reserved inventory is held at order-request submission. Shipment confirmation decrements both on-hand and reserved stock.</p><table className="table"><tbody>{order.items.map((item: any) => <tr key={item.id}><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{money(item.unitPriceCents)}</td><td>{money(item.unitPriceCents * item.quantity)}</td></tr>)}</tbody></table><div className="mt-4 text-right text-sm"><p>Subtotal {money(order.subtotalCents)}</p><p>Shipping {money(order.shippingCents)}</p><p>Tax {money(order.taxCents)}</p><p className="font-black">Total {money(order.totalCents)}</p></div></section>
    <section className="card p-5 mt-4"><h2 className="font-black">Eligibility</h2><pre className="mt-2 whitespace-pre-wrap text-sm">{order.verificationSnapshot ? JSON.stringify(order.verificationSnapshot, null, 2) : "No checkout eligibility snapshot stored."}</pre></section>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Fulfillment token status</h2>{order.fulfillmentTokens.length ? <ul className="grid gap-2 text-sm">{order.fulfillmentTokens.map((token: any) => <li key={token.id}>Sent {fmt(token.createdAt)} · {token.usedAt ? `used ${fmt(token.usedAt)}` : token.expiresAt < new Date() ? "expired" : "active"}</li>)}</ul> : <p>No fulfillment token sent.</p>}<p className="mt-3 text-sm text-slate-600">Resend fulfillment email/log by submitting a new order notification from the order pipeline if a token is expired or email logging failed.</p></section>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Email logs</h2>{order.emailLogs.length ? <ul className="grid gap-2 text-sm">{order.emailLogs.map((log: any) => <li key={log.id}>{fmt(log.createdAt)} · {log.type} · {log.to} · {log.subject} · {log.status}/{log.provider}</li>)}</ul> : <p>No email logs.</p>}</section>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Audit trail</h2>{result.auditLogs.length ? <ul className="grid gap-2 text-sm">{result.auditLogs.map((log: any) => <li key={log.id}>{fmt(log.createdAt)} · {log.action} · {log.note}</li>)}</ul> : <p>No audit records.</p>}</section>
  </AdminShell>;
}
