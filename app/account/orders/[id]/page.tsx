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
        Status detail uses order review labels and timeline milestones.
      </SectionHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <StatusBadge tone={order ? "success" : "warning"}>
            {order?.status || "Mock shell"}
          </StatusBadge>
          <p className="mt-3">Payment: {order?.payment || "mock only"}</p>
          <p>Verification: {order?.verification || "pending local review"}</p>
          {order ? <p className="font-black">Total: {money(order.total)}</p> : null}
          <div className="mt-5">
            <OrderStatusTimeline paid={order?.payment.includes("approved") ?? false} />
          </div>
        </section>
        <AlertPanel title="Compliance and fulfillment shell" tone="warning">
          Restricted-product warnings, eligibility status, and fulfillment holds remain visible.
          Fulfillment and payment collection are not enabled in this environment.
        </AlertPanel>
      </div>
    </AppShell>
  );
}
