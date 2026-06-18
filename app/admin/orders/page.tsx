import Link from "next/link";
import { AdminShell, AdminDataTable, StatusBadge, EmptyState } from "@/components/ui";
import { getAdminOrders } from "@/lib/admin/orders/service";

export const dynamic = "force-dynamic";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function OrdersAdmin() {
  const result = await getAdminOrders();
  if (!result.available) {
    return <AdminShell title="Orders"><EmptyState title="Database unavailable">Admin orders require DATABASE_URL. No mock orders are shown as real orders.</EmptyState></AdminShell>;
  }
  return (
    <AdminShell title="Orders">
      <AdminDataTable columns={["Order", "Customer", "Email", "Total", "Payment", "Status", "Restricted", "State", "ZIP", "Created", "Action"]} rows={result.orders.map((order: any) => [
        order.orderNumber,
        order.customerName ?? order.shippingAddress?.name ?? order.user?.name ?? "—",
        order.customerEmail ?? order.user?.email ?? "—",
        money(order.totalCents),
        <StatusBadge key={`${order.id}-pay`} tone={order.paymentAttempts[0]?.status === "APPROVED" ? "success" : "warning"}>{order.paymentAttempts[0]?.status ?? "NOT_STARTED"}</StatusBadge>,
        <StatusBadge key={`${order.id}-status`} tone={order.status === "BLOCKED" || order.status === "CANCELLED" ? "danger" : order.status === "FULFILLED" || order.status === "PAID" ? "success" : "warning"}>{order.status}</StatusBadge>,
        order.items.some((item: any) => item.product.restricted) ? "Yes" : "No",
        order.shippingAddress?.state ?? "—",
        order.shippingAddress?.postalCode ?? "—",
        fmt(order.createdAt),
        <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>View</Link>,
      ])} />
    </AdminShell>
  );
}
