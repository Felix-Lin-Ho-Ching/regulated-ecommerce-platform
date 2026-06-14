import Link from "next/link";
import { AppShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

export default async function Orders() {
  await requireCustomerSession("/account/orders");
  const orders = await getCustomerOrders();

  return (
    <AppShell>
      <SectionHeader eyebrow="Orders" title="Order history">
        Orders appear here with payment, verification, and fulfillment status.
      </SectionHeader>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet">
          Complete checkout review to create an order.
          <Link className="btn btn-primary mt-5" href="/products">
            Shop products
          </Link>
        </EmptyState>
      ) : (
        <section className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderNumber}>
                  <td>
                    <Link className="font-black text-teal-900" href={`/account/orders/${order.orderNumber}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge tone="success">{order.status}</StatusBadge>
                  </td>
                  <td>{order.payment}</td>
                  <td>{money(order.total)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AppShell>
  );
}
