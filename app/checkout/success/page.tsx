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
  const orderNumber = order?.orderNumber || orderNumberParam || "SF-ORDER";

  return (
    <AppShell>
      <SectionHeader eyebrow="Confirmation" title="Order confirmation">
        Your order was created for review. Fulfillment remains pending until all required reviews are complete.
      </SectionHeader>
      <CheckoutStepper active={5} />
      <section className="card mt-6 p-6">
        <StatusBadge tone="success">Test confirmation</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order {orderNumber}</h2>
        <p className="text-slate-600">
          Order status: {order?.status || "Fulfillment hold"} · Eligibility result: approved · Fulfillment: pending review
        </p>
        {order ? <p className="mt-2 font-black">Total {money(order.total)}</p> : null}
        <div className="mt-5">
          <OrderStatusTimeline paid={false} />
        </div>
        <Link className="btn btn-primary mt-5" href="/products">
          Continue shopping
        </Link>
      </section>
    </AppShell>
  );
}
