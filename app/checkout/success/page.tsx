import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  OrderStatusTimeline,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";

export default function Success() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Confirmation" title="Order confirmed">
        Mock payment succeeded after compliance approval.
      </SectionHeader>
      <CheckoutStepper active={5} />
      <section className="card mt-6 p-6">
        <StatusBadge tone="success">Paid</StatusBadge>
        <h2 className="mt-3 text-2xl font-black">Order SF-1007</h2>
        <p className="text-slate-600">
          Payment status: paid · Verification status: approved · Fulfillment: processing
        </p>
        <div className="mt-5">
          <OrderStatusTimeline paid />
        </div>
        <Link className="btn btn-primary mt-5" href="/account/orders/SF-1007">
          View order
        </Link>
      </section>
    </AppShell>
  );
}
