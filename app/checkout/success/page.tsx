import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  OrderStatusTimeline,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { getOrderByNumber } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumberParam } = await searchParams;
  const order = orderNumberParam ? await getOrderByNumber(orderNumberParam) : null;
  const orderNumber = order?.orderNumber || orderNumberParam || "SF-MOCK";

  return (
    <AppShell>
      <SectionHeader eyebrow="Confirmation" title="Order confirmed">
        Payment review succeeded after eligibility approval. No card data was collected.
      </SectionHeader>
      <CheckoutStepper active={5} />
      <section className="card mt-6 p-6">
        <StatusBadge tone="success">Mock paid</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order {orderNumber}</h2>
        <p className="text-slate-600">
          Payment status: review approved · Verification status: approved · Fulfillment: pending
          hold
        </p>
        {order ? <p className="mt-2 font-black">Total {money(order.total)}</p> : null}
        <div className="mt-5">
          <OrderStatusTimeline paid />
        </div>
        <Link className="btn btn-primary mt-5" href={`/account/orders/${orderNumber}`}>
          View order
        </Link>
      </section>
    </AppShell>
  );
}
