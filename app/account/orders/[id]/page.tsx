import { AppShell, OrderStatusTimeline, SectionHeader, StatusBadge, AlertPanel } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getOrderByNumber } from "@/lib/orders/order-service";
import { money } from "@/lib/utils";

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  await requireCustomerSession("/account/orders");
  const { id } = await params;
  const order = await getOrderByNumber(id);

  return (
    <AppShell>
      <SectionHeader eyebrow="Order detail" title={`Order ${id}`}>
        Status detail shows the order-request pipeline. Payment has not been collected and fulfillment has not started.
      </SectionHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <StatusBadge tone={order ? "success" : "warning"}>
            {order?.status || "Order review"}
          </StatusBadge>
          <p className="mt-3">Payment: {order?.payment || "not collected"}</p>
          <p>Eligibility: {order?.verification || "auto eligibility pending"}</p>
          {order ? <p className="font-black">Total: {money(order.total)}</p> : null}
          <div className="mt-5">
            <OrderStatusTimeline paymentCollected={false} />
          </div>
        </section>
        <AlertPanel title="Compliance and fulfillment shell" tone="warning">
          Eligibility status and payment holds remain visible. Fulfillment is not released until a future paid status exists.
        </AlertPanel>
      </div>
    </AppShell>
  );
}
