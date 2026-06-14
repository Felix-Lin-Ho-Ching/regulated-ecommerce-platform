import Link from "next/link";
import { AppShell, CheckoutStepper, CheckoutSummary, SectionHeader } from "@/components/ui";
import { AlertPanel } from "@/components/common/panels";
import { MockPaymentPanel } from "@/components/checkout/mock-payment-panel";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getCheckoutEligibilitySnapshot } from "@/lib/orders/order-service";

export default async function Payment() {
  const [cart, eligibility] = await Promise.all([
    getCartSnapshot(),
    getCheckoutEligibilitySnapshot(true),
  ]);
  const canContinue = eligibility.result.status === "available";

  return (
    <AppShell>
      <SectionHeader eyebrow="Payment" title="Payment review">
        Payment will be completed after eligibility approval.
      </SectionHeader>
      <CheckoutStepper active={4} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        {canContinue ? (
          <MockPaymentPanel />
        ) : (
          <section className="card p-5">
            <AlertPanel title={eligibility.result.label} tone="warning">
              {eligibility.result.message} Payment remains unavailable.
            </AlertPanel>
            <Link className="btn btn-secondary mt-5" href="/checkout/verification">
              Return to eligibility review
            </Link>
          </section>
        )}
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
