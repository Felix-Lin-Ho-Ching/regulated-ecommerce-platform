import Link from "next/link";
import {
  AlertPanel,
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  ComplianceResultPanel,
  SectionHeader,
} from "@/components/ui";
import type { CheckoutOutcome } from "@/lib/mock-data";

const sampleOutcomes: CheckoutOutcome[] = [
  "allowed",
  "blocked",
  "pending_admin_review",
  "pending_document_upload",
  "ready_for_payment",
];

export default function Checkout() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Checkout" title="Simple checkout with eligibility before payment">
        Customer checkout follows Cart → Shipping → Eligibility → Payment → Confirmation. Address,
        compliance, documents, risk, and admin exceptions are grouped under Eligibility.
      </SectionHeader>
      <CheckoutStepper active={1} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <AlertPanel title="Live checkout remains disabled" tone="warning">
            This storefront keeps payment and fulfillment mocked. Continue through the flow to preview how
            eligibility gates protect restricted-product checkout.
          </AlertPanel>
          <div className="grid gap-3">
            {sampleOutcomes.map((outcome) => (
              <div className="card p-4" key={outcome}>
                <ComplianceResultPanel outcome={outcome} />
                <Link className="btn btn-secondary mt-3" href={`/checkout/verification?case=${outcome}`}>
                  Preview {outcome.replaceAll("_", " ")}
                </Link>
              </div>
            ))}
          </div>
        </section>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
