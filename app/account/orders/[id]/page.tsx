import { notFound } from "next/navigation";
import { AppShell, SectionHeader, StatusBadge, AlertPanel } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getOrderByNumber } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

function fmt(date?: string | null) { return date ? new Date(date).toLocaleString("en-US") : "—"; }
function statusTone(status: string) { return status === "Cancelled" ? "danger" as const : status === "Shipped" ? "success" as const : "warning" as const; }

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  await requireCustomerSession("/account/orders");
  const { id } = await params;
  const order = await getOrderByNumber(id);
  if (!order) notFound();
  const showShipment = order.shipmentStatus === "Shipped";

  return (
    <AppShell>
      <SectionHeader eyebrow="Order detail" title={`Order ${order.orderNumber}`}>
        Customer order details include items, totals, shipping address, payment status, and shipment status only when shipped.
      </SectionHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card p-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge>
            <StatusBadge tone="warning">{order.payment}</StatusBadge>
            <StatusBadge tone={showShipment ? "success" : "warning"}>{showShipment ? "Shipped" : order.fulfillment}</StatusBadge>
          </div>
          {order.status === "Cancelled" ? <div className="mt-4"><AlertPanel title="Order request cancelled" tone="danger">Payment not collected. Fulfillment not released. No shipment has started for this order request.</AlertPanel></div> : null}
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold">Order number</dt><dd>{order.orderNumber}</dd></div>
            <div><dt className="font-bold">Order date</dt><dd>{fmt(order.createdAt)}</dd></div>
            <div><dt className="font-bold">Current status</dt><dd>{order.status}</dd></div>
            <div><dt className="font-bold">Payment status</dt><dd>{order.payment}</dd></div>
            <div><dt className="font-bold">Restricted item</dt><dd>{order.hasRestrictedItems ? "Yes" : "No"}</dd></div>
            <div><dt className="font-bold">Shipment status</dt><dd>{showShipment ? "Shipped" : "Not shipped"}</dd></div>
            {showShipment ? <><div><dt className="font-bold">Carrier</dt><dd>{order.carrier || "—"}</dd></div><div><dt className="font-bold">Tracking number</dt><dd>{order.trackingNumber || "—"}</dd></div><div><dt className="font-bold">Shipped date</dt><dd>{fmt(order.shippedAt)}</dd></div></> : null}
          </dl>
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
            <table className="table">
              <thead><tr><th>Item</th><th>SKU</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead>
              <tbody>{order.items.map((item) => <tr key={`${item.sku}-${item.name}`}><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{money(item.unitPrice)}</td><td>{money(item.total)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-5 text-right text-sm"><p>Subtotal {money(order.subtotal)}</p><p>Shipping {money(order.shipping)}</p><p>Tax {money(order.tax)}</p><p className="text-lg font-black">Total {money(order.total)}</p></div>
        </section>
        <aside className="card p-5">
          <h2 className="font-black">Shipping address</h2>
          {order.shippingAddress ? <address className="mt-3 not-italic text-sm text-slate-700">{order.shippingAddress.name}<br />{order.shippingAddress.line1}<br />{order.shippingAddress.line2 ? <>{order.shippingAddress.line2}<br /></> : null}{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.country ?? "US"}</address> : <p className="mt-3 text-sm text-slate-600">Shipping address unavailable.</p>}
          {!showShipment && order.status !== "Cancelled" ? <p className="mt-5 text-sm text-slate-600">Fulfillment has not started. Tracking details will appear here only after a future shipped status.</p> : null}
        </aside>
      </div>
    </AppShell>
  );
}
