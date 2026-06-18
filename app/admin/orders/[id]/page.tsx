import { notFound } from "next/navigation";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { adminOrderStatuses, getAdminOrder } from "@/lib/admin/orders/service";
import { updateOrderStatusAction } from "@/lib/admin/orders/actions";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result.available) return <AdminShell title="Order"><EmptyState title="Database unavailable">Order detail requires DATABASE_URL.</EmptyState></AdminShell>;
  if (!result.order) notFound();
  const order: any = result.order;
  const address = order.shippingAddress;
  const restricted = order.items.some((item: any) => item.product.restricted);
  return <AdminShell title={`Order ${order.orderNumber}`}>
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <section className="card p-5">
        <SectionHeader eyebrow="Order detail" title={order.orderNumber}>Created {fmt(order.createdAt)}</SectionHeader>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <p><b>Status:</b> <StatusBadge tone="warning">{order.status}</StatusBadge></p><p><b>Payment:</b> {order.paymentAttempts[0]?.status ?? "NOT_STARTED"}</p>
          <p><b>Email:</b> {order.customerEmail ?? order.user?.email ?? "—"}</p><p><b>Name:</b> {order.customerName ?? address?.name ?? order.user?.name ?? "—"}</p>
          <p><b>Phone:</b> {order.customerPhone ?? address?.phone ?? "—"}</p><p><b>Restricted:</b> {restricted ? "Yes" : "No"}</p>
          <p className="md:col-span-2"><b>Shipping:</b> {[address?.name, address?.line1, address?.line2, `${address?.city ?? ""}, ${address?.state ?? ""} ${address?.postalCode ?? ""}`, address?.country].filter(Boolean).join(", ")}</p>
        </div>
      </section>
      <form action={updateOrderStatusAction} className="card p-5 grid gap-3">
        <h2 className="font-black">Update status</h2><input type="hidden" name="orderId" value={order.id}/><input type="hidden" name="orderNumber" value={order.orderNumber}/>
        <select name="status" className="input" defaultValue={order.status}>{adminOrderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <textarea name="note" className="input" required minLength={8} placeholder="Required audit note" />
        <button className="btn btn-primary">Save status</button>
      </form>
    </div>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Items</h2><table className="table"><tbody>{order.items.map((item: any) => <tr key={item.id}><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{money(item.unitPriceCents)}</td><td>{money(item.unitPriceCents * item.quantity)}</td></tr>)}</tbody></table><div className="mt-4 text-right text-sm"><p>Subtotal {money(order.subtotalCents)}</p><p>Shipping {money(order.shippingCents)}</p><p>Tax {money(order.taxCents)}</p><p className="font-black">Total {money(order.totalCents)}</p></div></section>
    <section className="card p-5 mt-4"><h2 className="font-black">Eligibility</h2><pre className="mt-2 whitespace-pre-wrap text-sm">{order.verificationSnapshot ? JSON.stringify(order.verificationSnapshot, null, 2) : "No checkout eligibility snapshot stored."}</pre></section>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Email logs</h2>{order.emailLogs.length ? <ul className="grid gap-2 text-sm">{order.emailLogs.map((log: any) => <li key={log.id}>{fmt(log.createdAt)} · {log.type} · {log.to} · {log.subject} · {log.status}/{log.provider}</li>)}</ul> : <p>No email logs.</p>}</section>
    <section className="card p-5 mt-4"><h2 className="font-black mb-3">Audit trail</h2>{result.auditLogs.length ? <ul className="grid gap-2 text-sm">{result.auditLogs.map((log: any) => <li key={log.id}>{fmt(log.createdAt)} · {log.action} · {log.note}</li>)}</ul> : <p>No audit records.</p>}</section>
  </AdminShell>;
}
