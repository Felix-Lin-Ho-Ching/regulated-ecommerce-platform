import Link from "next/link";
import {
  AlertPanel,
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  SectionHeader,
} from "@/components/ui";

export default function Payment() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Payment" title="Mock payment handoff">
        The store does not collect card data and live checkout remains disabled.
      </SectionHeader>
      <CheckoutStepper active={4} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <AlertPanel title="Ready for mock payment" tone="success">
            Compliance approved. The next buttons represent a future payment-provider outcome.
          </AlertPanel>
          <div className="mt-5 flex gap-3">
            <Link className="btn btn-primary" href="/checkout/success">
              Mock payment success
            </Link>
            <Link className="btn btn-secondary" href="/checkout/failed">
              Mock payment failure
            </Link>
          </div>
        </section>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
