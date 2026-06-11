import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  ComplianceResultPanel,
  SectionHeader,
  VerificationRequirementList,
} from "@/components/ui";
import type { CheckoutOutcome } from "@/lib/mock-data";

export default async function Verification({
  searchParams,
}: {
  searchParams: Promise<{ case?: CheckoutOutcome }>;
}) {
  const sp = await searchParams;
  const outcome = sp.case || "pending_admin_review";

  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Eligibility review">
        Address validation, compliance rules, document requirements, provider rules, risk checks, and
        admin exceptions are shown together before payment is available.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <ComplianceResultPanel outcome={outcome} />
          <section className="card p-5">
            <h2 className="text-xl font-black">Buyer verification requirements</h2>
            <VerificationRequirementList />
            <div className="mt-5 flex flex-wrap gap-3">
              {outcome === "pending_document_upload" ? (
                <Link className="btn btn-primary" href="/checkout/document-upload">
                  Upload documents
                </Link>
              ) : null}
              {outcome === "ready_for_payment" ? (
                <Link className="btn btn-primary" href="/checkout/payment">
                  Continue to mock payment
                </Link>
              ) : null}
              {outcome === "blocked" ? (
                <Link className="btn btn-secondary" href="/products">
                  Return to products
                </Link>
              ) : null}
              {outcome === "pending_admin_review" ? (
                <Link className="btn btn-secondary" href="/account/orders/CG-1003">
                  View review status
                </Link>
              ) : null}
            </div>
          </section>
        </section>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
