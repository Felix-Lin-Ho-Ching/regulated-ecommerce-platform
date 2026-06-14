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
import { removeRestrictedItemsAction } from "@/lib/cart/actions";
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
  const canContinue = eligibility.result.status === "available";

  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Eligibility">
        We check restricted items after shipping so browsing and cart building stay simple.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <section className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">Shipping destination</h2>
              <StatusBadge tone={resultTone(eligibility.result.status)}>
                {eligibility.hasRestrictedItems ? eligibility.result.label : "Ready"}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {eligibility.hasRestrictedItems
                ? eligibility.result.message
                : "Your cart does not include restricted items. You can continue to payment."}
            </p>
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
            <h2 className="text-xl font-black">Next step</h2>
            {eligibility.hasRestrictedItems ? <VerificationRequirementList /> : null}
            {sp.attestation === "missing" ? (
              <div className="mt-4">
                <AlertPanel title="Confirmation needed" tone="danger">
                  Confirm the required statements before continuing.
                </AlertPanel>
              </div>
            ) : null}
            {blocked ? (
              <div className="mt-5">
                <AlertPanel title="Item unavailable" tone="danger">
                  This item is not available for your shipping destination.
                </AlertPanel>
              </div>
            ) : null}
            {reviewRequired ? (
              <div className="mt-5">
                <AlertPanel title="Verification required" tone="warning">
                  Verification is required before payment.
                </AlertPanel>
              </div>
            ) : null}
            {canContinue ? (
              <form action={continueFromEligibilityAction} className="mt-5 grid gap-3">
                {eligibility.hasRestrictedItems ? (
                  <>
                    <label className="flex items-start gap-3 text-sm font-bold">
                      <input className="mt-1" name="isAtLeast18" type="checkbox" required />
                      I confirm I am at least 18 years old.
                    </label>
                    <label className="flex items-start gap-3 text-sm font-bold">
                      <input className="mt-1" name="acknowledged" type="checkbox" required />
                      I understand shipping restrictions may apply to restricted items.
                    </label>
                  </>
                ) : null}
                <button className="btn btn-primary w-fit" type="submit">
                  Continue to payment
                </button>
              </form>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="btn btn-secondary" href="/checkout/address">
                  Change shipping address
                </Link>
                {reviewRequired ? (
                  <>
                    <Link className="btn btn-secondary" href="/restricted-products-policy">
                      Submit required information
                    </Link>
                    <a className="btn btn-secondary" href="mailto:support@stunfry.example">
                      Contact support
                    </a>
                  </>
                ) : null}
                <form action={removeRestrictedItemsAction}>
                  <button className="btn btn-secondary" type="submit">
                    Remove restricted item from cart
                  </button>
                </form>
              </div>
            )}
          </section>
        </section>
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
