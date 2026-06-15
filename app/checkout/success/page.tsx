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
      <SectionHeader eyebrow="Confirmation" title="Order confirmation">
        Your order was submitted. Fulfillment will begin after standard order review is complete.
      </SectionHeader>
      <section className="card mt-6 p-6">
        <StatusBadge tone="success">Order submitted</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order {orderNumber}</h2>
        <p className="text-slate-600">Status: {order?.status || "Fulfillment hold"} · Eligibility result: approved</p>
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
        {order ? <p className="mt-5 text-xl font-black">Total {money(order.total)}</p> : null}
        <Link className="btn btn-primary mt-5" href="/products">Continue shopping</Link>
      </section>
    </AppShell>
  );
}
