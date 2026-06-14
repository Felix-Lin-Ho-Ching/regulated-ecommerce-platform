import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  ComplianceResultPanel,
  SectionHeader,
  VerificationRequirementList,
} from "@/components/ui";
import { AlertPanel } from "@/components/common/panels";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getShippingDraft } from "@/lib/orders/order-service";
import { evaluateEligibility } from "@/lib/eligibility/rules";
import type { CheckoutOutcome } from "@/lib/mock-data";

export default async function Verification({
  searchParams,
}: {
  searchParams: Promise<{ case?: CheckoutOutcome }>;
}) {
  const [sp, cart, shipping] = await Promise.all([searchParams, getCartSnapshot(), getShippingDraft()]);
  const restrictedLine = cart.lines.find((line) => line.product.restricted);
  const eligibility = restrictedLine
    ? evaluateEligibility({
        state: shipping.state,
        zip: shipping.postalCode,
        isAtLeast18: true,
        productCategory: restrictedLine.product.category,
        restricted: true,
      })
    : evaluateEligibility({ restricted: false });
  const calculatedOutcome: CheckoutOutcome =
    eligibility.status === "blocked"
      ? "blocked"
      : eligibility.status === "documents_required"
        ? "pending_document_upload"
        : eligibility.status === "manual_review"
          ? "pending_admin_review"
          : "ready_for_payment";
  const outcome = sp.case || calculatedOutcome;

  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Eligibility and verification">
        Age attestation, destination review, restricted-product category, rule outcome, and verification requirements are checked before payment.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <ComplianceResultPanel outcome={outcome} />
          <section className="card p-5">
            <h2 className="text-xl font-black">Buyer eligibility requirements</h2>
            <VerificationRequirementList />
            <div className="mt-5">
              <AlertPanel title="Document review" tone="warning">
                If destination rules require documents or staff review, payment remains hidden until
                approval. This flow shows the control points without collecting documents.
              </AlertPanel>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {outcome === "pending_document_upload" ? (
                <Link className="btn btn-primary" href="/checkout/document-upload">
                  Upload documents
                </Link>
              ) : null}
              {outcome === "ready_for_payment" ? (
                <Link className="btn btn-primary" href="/checkout/payment">
                  Continue to payment review
                </Link>
              ) : null}
              {outcome === "blocked" ? (
                <Link className="btn btn-secondary" href="/products">
                  Return to products
                </Link>
              ) : null}
              {outcome === "pending_admin_review" ? (
                <Link className="btn btn-secondary" href="/account/orders">
                  View review status
                </Link>
              ) : null}
            </div>
          </section>
        </section>
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
