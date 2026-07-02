import Link from "next/link";
import { AdminShell, AdminDataTable, StatusBadge, EmptyState } from "@/components/ui";
import { adminOrderStatuses, getAdminOrders } from "@/lib/admin/orders/service";

export const dynamic = "force-dynamic";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
const v = (searchParams: Record<string, string | string[] | undefined>, key: string) => typeof searchParams[key] === "string" ? searchParams[key] as string : "";

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = { orderNumber: v(params, "orderNumber"), customerEmail: v(params, "customerEmail"), customerName: v(params, "customerName"), status: v(params, "status"), payment: v(params, "payment"), restricted: v(params, "restricted"), state: v(params, "state"), postalCode: v(params, "postalCode"), createdFrom: v(params, "createdFrom"), createdTo: v(params, "createdTo") };
  const result = await getAdminOrders(filters);
  if (!result.available) return <AdminShell title="Orders" currentPath="/admin/orders"><EmptyState title="Database unavailable">Admin order requests require DATABASE_URL. No fallback orders are shown as real orders.</EmptyState></AdminShell>;
  return (
    <AdminShell title="Orders" currentPath="/admin/orders">
      <form className="card mb-4 grid gap-3 p-5 md:grid-cols-4" action="/admin/orders">
        <input className="input" name="orderNumber" placeholder="Order number" defaultValue={filters.orderNumber} />
        <input className="input" name="customerEmail" placeholder="Customer email" defaultValue={filters.customerEmail} />
        <input className="input" name="customerName" placeholder="Customer name" defaultValue={filters.customerName} />
        <select className="input" name="status" defaultValue={filters.status}><option value="">Any status</option>{adminOrderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <input className="input" name="payment" placeholder="Payment status/mode" defaultValue={filters.payment} />
        <select className="input" name="restricted" defaultValue={filters.restricted}><option value="">Restricted?</option><option value="yes">Restricted only</option><option value="no">Unrestricted only</option></select>
        <input className="input" name="state" placeholder="State" defaultValue={filters.state} />
        <input className="input" name="postalCode" placeholder="ZIP/postal" defaultValue={filters.postalCode} />
        <input className="input" name="createdFrom" type="date" defaultValue={filters.createdFrom} />
        <input className="input" name="createdTo" type="date" defaultValue={filters.createdTo} />
        <button className="btn btn-primary">Filter orders</button>
        <Link className="btn btn-secondary text-center" href="/admin/orders">Clear</Link>
      </form>
      <AdminDataTable columns={["Order", "Customer", "Email", "Total", "Mode", "Payment", "Status", "Restricted", "State", "ZIP", "Created", "Action"]} rows={result.orders.map((order: any) => [
        order.orderNumber,
        order.customerName ?? order.shippingAddress?.name ?? order.user?.name ?? "—",
        order.customerEmail ?? order.user?.email ?? "—",
        money(order.totalCents),
        order.paymentMode ?? "authorize_net_emulator",
        <StatusBadge key={`${order.id}-pay`} tone={order.paymentAttempts[0]?.status === "APPROVED" ? "success" : "warning"}>{order.paymentAttempts[0]?.status ?? "NOT_STARTED"}</StatusBadge>,
        <StatusBadge key={`${order.id}-status`} tone={order.status === "BLOCKED" || order.status === "CANCELLED" ? "danger" : order.status === "FULFILLED" || order.status === "PAID" ? "success" : "warning"}>{order.status === "READY_FOR_PAYMENT" ? "Ready for payment" : order.status}</StatusBadge>,
        order.items.some((item: any) => item.product.restricted) ? "Yes" : "No",
        order.shippingAddress?.state ?? "—",
        order.shippingAddress?.postalCode ?? "—",
        fmt(order.createdAt),
        <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>View</Link>,
      ])} />
    </AdminShell>
  );
}
