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
        Your order request was submitted, eligibility checks passed automatically, and payment has not been collected. The order is ready for the next payment step; fulfillment has not started.
      </SectionHeader>
      <section className="card mt-6 p-6">
        <StatusBadge tone="warning">Payment not collected</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order request {orderNumber}</h2>
        <p className="text-slate-600">
          Status: {order?.status || "Ready for payment"} · Eligibility checks passed · Payment not collected
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
          Destination and age checks, when required, have passed. Payment has not been collected and fulfillment has not started. The order request is ready for a future payment step.
        </p>
        <Link className="btn btn-primary mt-5" href="/products">Continue shopping</Link>
      </section>
    </AppShell>
  );
}
