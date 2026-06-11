import Link from "next/link";
import { AlertPanel, AppShell, CheckoutStepper, CheckoutSummary, SectionHeader } from "@/components/ui";

export default function Payment() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Payment" title="Mock hosted payment">
        The storefront does not collect card data. This page previews a future hosted-payment handoff.
      </SectionHeader>
      <CheckoutStepper active={4} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <AlertPanel title="Ready for mock payment" tone="success">
            Eligibility is approved. The next buttons simulate hosted payment success or failure.
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
