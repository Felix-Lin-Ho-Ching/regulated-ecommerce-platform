import Link from "next/link";
import { AlertPanel, AppShell, CheckoutStepper, CheckoutSummary, FormField, SectionHeader } from "@/components/ui";

export default function Address() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Shipping" title="Shipping address">
        Shipping details are collected before eligibility checks begin.
      </SectionHeader>
      <CheckoutStepper active={2} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" value="Taylor Brooks" />
            <FormField label="Street address" value="410 Congress Ave" />
            <FormField label="City" value="Austin" />
            <FormField label="State" value="TX" />
            <FormField label="ZIP" value="78701" />
            <FormField label="Phone" value="555-0129" />
          </div>
          <div className="mt-5">
            <AlertPanel title="Shipping saved for eligibility review" tone="success">
              Address validation and destination rules are grouped under the next Eligibility step.
            </AlertPanel>
          </div>
          <Link className="btn btn-primary mt-5" href="/checkout/verification?case=ready_for_payment">
            Continue to eligibility
          </Link>
        </section>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
