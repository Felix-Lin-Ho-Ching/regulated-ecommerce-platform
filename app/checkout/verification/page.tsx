import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  SectionHeader,
  VerificationRequirementList,
} from "@/components/ui";
import { AlertPanel } from "@/components/common/panels";
import { StatusBadge } from "@/components/common/badge";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getCheckoutEligibilitySnapshot, getShippingDraft } from "@/lib/orders/order-service";
import { continueFromEligibilityAction } from "@/lib/orders/actions";

function resultTone(status: string) {
  if (status === "available") return "success";
  if (status === "blocked") return "danger";
  return "warning";
}

export default async function Verification({
  searchParams,
}: {
  searchParams: Promise<{ attestation?: string }>;
}) {
  const [sp, cart, shipping, eligibility] = await Promise.all([
    searchParams,
    getCartSnapshot(),
    getShippingDraft(),
    getCheckoutEligibilitySnapshot(true),
  ]);
  const blocked = eligibility.result.status === "blocked";
  const reviewRequired = ["manual_review", "documents_required"].includes(eligibility.result.status);

  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Eligibility review">
        We review age confirmation, shipping state, ZIP code when provided, restricted-product status, and destination rules before payment is available.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <section className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">Destination result</h2>
              <StatusBadge tone={resultTone(eligibility.result.status)}>
                {eligibility.result.label}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{eligibility.result.message}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <dt className="font-black">State</dt>
                <dd>{shipping.state || "Not entered"}</dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <dt className="font-black">ZIP</dt>
                <dd>{shipping.postalCode || "Not entered"}</dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <dt className="font-black">Restricted items</dt>
                <dd>{eligibility.hasRestrictedItems ? "Included" : "None"}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-black">Buyer confirmations</h2>
            <VerificationRequirementList />
            {sp.attestation === "missing" ? (
              <div className="mt-4">
                <AlertPanel title="Confirmation needed" tone="danger">
                  Confirm the required eligibility statements before continuing.
                </AlertPanel>
              </div>
            ) : null}
            {blocked ? (
              <div className="mt-5">
                <AlertPanel title="Checkout stopped" tone="danger">
                  Payment is unavailable because this destination is not eligible for the restricted item in your cart.
                </AlertPanel>
              </div>
            ) : null}
            {reviewRequired ? (
              <div className="mt-5">
                <AlertPanel title="Review required" tone="warning">
                  Payment remains unavailable while additional verification or staff review is pending.
                </AlertPanel>
              </div>
            ) : null}
            {eligibility.result.status === "available" ? (
              <form action={continueFromEligibilityAction} className="mt-5 grid gap-3">
                <label className="flex items-start gap-3 text-sm font-bold">
                  <input className="mt-1" name="isAtLeast18" type="checkbox" required />
                  I confirm I am at least 18 years old.
                </label>
                <label className="flex items-start gap-3 text-sm font-bold">
                  <input className="mt-1" name="acknowledged" type="checkbox" required />
                  I understand restricted products may require additional review before fulfillment.
                </label>
                <button className="btn btn-primary w-fit" type="submit">
                  Continue to payment
                </button>
              </form>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="btn btn-secondary" href="/checkout/address">
                  Edit shipping
                </Link>
                <Link className="btn btn-secondary" href="/products">
                  Return to products
                </Link>
              </div>
            )}
          </section>
        </section>
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
