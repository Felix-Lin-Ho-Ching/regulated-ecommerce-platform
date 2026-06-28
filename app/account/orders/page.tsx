import Link from "next/link";
import { AppShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "Cancelled") return "danger" as const;
  if (status === "Shipped") return "success" as const;
  return "warning" as const;
}

export default async function Orders() {
  await requireCustomerSession("/account/orders");
  const orders = await getCustomerOrders();

  return (
    <AppShell>
      <SectionHeader eyebrow="Orders" title="Order history">
        Order requests appear here with eligibility, payment, and shipment status. Payment is not collected during checkout.
      </SectionHeader>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet">
          Submit checkout to create an eligible order request that is ready for the future payment step.
          <Link className="btn btn-primary mt-5" href="/products">Shop products</Link>
        </EmptyState>
      ) : (
        <section className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Order number</th>
                <th>Created date</th>
                <th>Total</th>
                <th>Order status</th>
                <th>Payment status</th>
                <th>Restricted item</th>
                <th>Fulfillment</th>
                <th>Shipment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderNumber}>
                  <td><Link className="font-black text-teal-900" href={`/account/orders/${order.orderNumber}`}>{order.orderNumber}</Link></td>
                  <td>{new Date(order.createdAt).toLocaleDateString("en-US")}</td>
                  <td>{money(order.total)}</td>
                  <td><StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge></td>
                  <td>{order.payment}</td>
                  <td>{order.hasRestrictedItems ? "Yes" : "No"}</td>
                  <td>{order.fulfillment}</td>
                  <td>{order.shipmentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AppShell>
  );
}
