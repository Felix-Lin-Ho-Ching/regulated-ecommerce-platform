import Link from "next/link";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { adminOrderStatuses, getAdminOrder, isTerminalAdminOrderStatus } from "@/lib/admin/orders/service";
import { OrderStatusForm } from "@/components/admin/orders/order-status-form";
import { CancelOrderForm } from "@/components/admin/orders/cancel-order-form";
import { InternalNoteForm } from "@/components/admin/orders/internal-note-form";
import { EmailActionsForm } from "@/components/admin/orders/email-actions-form";
import { SimulatePaymentForm } from "@/components/admin/orders/simulate-payment-form";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
const statusTone = (status: string) => status === "BLOCKED" || status === "CANCELLED" ? "danger" : status === "READY_FOR_PAYMENT" || status === "PAID" ? "success" : "warning";
const label = (s: string) => s.replaceAll("_", " ").toLowerCase();

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result.available) return <AdminShell title="Order"><EmptyState title="Database unavailable">Order detail requires DATABASE_URL.</EmptyState></AdminShell>;
  if (!result.order) return <AdminShell title="Order not found"><EmptyState title="Order not found">This order could not be found. <Link className="font-bold text-teal-900 underline" href="/admin/orders">Back to orders</Link></EmptyState></AdminShell>;
  const order: any = result.order;
  const address = order.shippingAddress;
  const restricted = order.items.some((item: any) => item.product.restricted);
  const notes = result.auditLogs.filter((log: any) => log.metadata && typeof log.metadata === "object" && "internalNote" in log.metadata);
  const isTerminalOrder = isTerminalAdminOrderStatus(order.status);
  const canUpdateStatus = !isTerminalOrder && order.fulfillmentStatus !== "SHIPPED" && !order.shippedAt;
  const canCancel = order.status !== "SHIPPED" && order.fulfillmentStatus !== "SHIPPED" && order.status !== "FULFILLED" && order.status !== "CANCELLED" && !order.shippedAt;
  const showPickPackLink = order.status === "PAID" || order.status === "SHIPPED" || ["READY_TO_SHIP", "PICKING", "SHIPPED"].includes(order.fulfillmentStatus);
  const fulfillmentUnreleasedMessage = order.status === "READY_FOR_PAYMENT" || order.status !== "PAID" ? "Fulfillment not released because payment has not been collected" : null;
  const timeline = [...result.auditLogs.map((log: any) => ({ id: log.id, when: log.createdAt, title: log.metadata?.status ? label(String(log.metadata.status)) : label(log.action), detail: log.note })), ...order.emailLogs.map((log: any) => ({ id: log.id, when: log.createdAt, title: `${label(log.type)} logged`, detail: `${log.to} · ${log.subject}` }))].sort((a, b) => a.when.getTime() - b.when.getTime());
  return <AdminShell title={`Order ${order.orderNumber}`}>
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <section className="card p-5">
        <SectionHeader eyebrow="Order detail" title={order.orderNumber}>Created {fmt(order.createdAt)}</SectionHeader>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p><b>Current status:</b> <StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge></p><p><b>Payment:</b> Gateway · {order.paymentMode ?? "authorize_net_emulator"}</p>
          <p><b>Fulfillment release:</b> {order.status === "PAID" || order.status === "SHIPPED" ? "Released" : "Not released"} · {order.fulfillmentStatus}</p><p><b>Restricted item:</b> {restricted ? "Yes" : "No"}</p>
          <p><b>Customer:</b> {order.customerName ?? address?.name ?? order.user?.name ?? "—"}</p><p><b>Email:</b> {order.customerEmail ?? order.user?.email ?? "—"}</p>
          <p><b>Phone:</b> {order.customerPhone ?? address?.phone ?? "—"}</p><p><b>State/ZIP:</b> {address?.state ?? "—"} {address?.postalCode ?? "—"}</p>
          <p><b>Payment attempt:</b> {order.paymentAttempts[0]?.provider ?? "ORDER_REQUEST"}/{order.paymentAttempts[0]?.status ?? "NOT_STARTED"}</p><p><b>Shipment:</b> {order.shippedAt ? `Shipped ${fmt(order.shippedAt)}` : "Not shipped"}</p>
          <p className="md:col-span-2"><b>Shipping address:</b> {[address?.name, address?.line1, address?.line2, `${address?.city ?? ""}, ${address?.state ?? ""} ${address?.postalCode ?? ""}`, address?.country].filter(Boolean).join(", ")}</p>{showPickPackLink ? <p className="md:col-span-2"><Link className="font-bold text-teal-900 underline" href={`/admin/fulfillment/${order.id}/pick-pack`}>Open fulfillment pick/pack view</Link></p> : null}{fulfillmentUnreleasedMessage ? <p className="md:col-span-2 font-bold text-amber-800">{fulfillmentUnreleasedMessage}</p> : null}
        </div>
      </section>
      <div>{canUpdateStatus ? <OrderStatusForm orderId={order.id} orderNumber={order.orderNumber} currentStatus={order.status} statuses={adminOrderStatuses.filter((s) => !["PAID", "FULFILLED", "SHIPPED", "CANCELLED", "BLOCKED"].includes(s))} /> : <section className="card p-5"><h2 className="font-black">Update status</h2><p className="mt-2 text-sm text-slate-600">Generic status updates are unavailable for terminal or shipped orders. Internal notes and eligible email log actions remain available.</p></section>}{order.fulfillmentStatus === "FULFILLMENT_HOLD" && ["READY_FOR_PAYMENT", "PENDING_PAYMENT", "PAYMENT_FAILED", "ORDER_REQUEST_SUBMITTED", "AUTO_ELIGIBLE"].includes(order.status) ? <SimulatePaymentForm orderId={order.id} /> : null}{canCancel ? <CancelOrderForm orderId={order.id} /> : null}<InternalNoteForm orderId={order.id} /><EmailActionsForm orderId={order.id} cancelled={order.status === "CANCELLED"} /></div>
    </div>
    <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Items / inventory reservation state</h2><p className="mb-3 text-sm text-slate-600">{order.status === "PAID" || order.status === "SHIPPED" ? "Payment has been collected for fulfillment processing. Shipment still requires active reservations and stock." : "Payment has not been collected, so fulfillment remains unreleased. Cancellation releases active reservations instead of deleting the order."}</p><table className="table"><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Reservation</th><th>Total</th></tr></thead><tbody>{order.items.map((item: any) => { const reservations = item.variant?.inventory?.reservations?.filter((r: any) => r.orderItemId === item.id) ?? []; return <tr key={item.id}><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{reservations.length ? reservations.map((r: any) => `${r.status} x${r.quantity}`).join(", ") : "No reservation"}</td><td>{money(item.unitPriceCents * item.quantity)}</td></tr>; })}</tbody></table><div className="mt-4 text-right text-sm"><p>Subtotal {money(order.subtotalCents)}</p><p>Shipping {money(order.shippingCents)}</p><p>Tax {money(order.taxCents)}</p><p className="font-black">Total {money(order.totalCents)}</p></div></section>
    <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Internal notes</h2>{notes.length ? <ul className="grid gap-2 text-sm">{notes.map((log: any) => <li key={log.id}><b>{fmt(log.createdAt)}:</b> {log.note}</li>)}</ul> : <p className="text-sm text-slate-600">No internal notes.</p>}</section>
    <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Readable audit timeline</h2>{timeline.length ? <ol className="grid gap-3 text-sm">{timeline.map((entry) => <li className="border-l-4 border-teal-700 pl-3" key={entry.id}><b>{fmt(entry.when)} · {entry.title}</b><br />{entry.detail}</li>)}</ol> : <p>No audit records.</p>}</section>
    <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Email logs</h2>{order.emailLogs.length ? <ul className="grid gap-2 text-sm">{order.emailLogs.map((log: any) => <li key={log.id}>{fmt(log.createdAt)} · {log.type} · {log.to} · {log.subject} · {log.status}/{log.provider}</li>)}</ul> : <p>No email logs.</p>}</section>
    <section className="card mt-4 p-5"><h2 className="font-black">Eligibility snapshot</h2><pre className="mt-2 whitespace-pre-wrap text-sm">{order.verificationSnapshot ? JSON.stringify(order.verificationSnapshot, null, 2) : "No checkout eligibility snapshot stored."}</pre></section>
  </AdminShell>;
}
