import Link from "next/link";
import { AppShell, SectionHeader, StatusBadge } from "@/components/ui";
import { getOrderByNumber } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

export default async function Success({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderNumberParam } = await searchParams;
  const order = orderNumberParam ? await getOrderByNumber(orderNumberParam) : null;
  const orderNumber = order?.orderNumber || orderNumberParam || "SF-ORDER";

  return (
    <AppShell>
      <SectionHeader eyebrow="Order request" title="Order request submitted">
        Your order request was submitted. Payment has not been collected, and the order will be reviewed before any fulfillment or payment step.
      </SectionHeader>
      <section className="card mt-6 p-6">
        <StatusBadge tone="warning">Payment not collected</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order request {orderNumber}</h2>
        <p className="text-slate-600">
          Status: {order?.status || "ORDER_REQUEST_SUBMITTED"} · Review required before fulfillment/payment
        </p>
        {order?.items?.length ? (
          <div className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200">
            {order.items.map((item) => (
              <div className="flex justify-between gap-4 p-4" key={item.name}>
                <span>{item.name} × {item.quantity}</span>
                <strong>{money(item.total)}</strong>
              </div>
            ))}
          </div>
        ) : null}
        {order ? <p className="mt-5 text-xl font-black">Request total {money(order.total)}</p> : null}
        <p className="mt-3 text-sm text-slate-600">
          We will review destination eligibility, age information when required, inventory reservation, and next steps before collecting payment.
        </p>
        <Link className="btn btn-primary mt-5" href="/products">Continue shopping</Link>
      </section>
    </AppShell>
  );
}
