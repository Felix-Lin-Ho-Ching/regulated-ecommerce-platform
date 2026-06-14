import { AppShell, CheckoutStepper, CheckoutSummary, SectionHeader } from "@/components/ui";
import { MockPaymentPanel } from "@/components/checkout/mock-payment-panel";
import { getCartSnapshot } from "@/lib/cart/cart-service";

export default async function Payment() {
  const cart = await getCartSnapshot();

  return (
    <AppShell>
      <SectionHeader eyebrow="Payment" title="Payment">
        Payment is available after eligibility is approved. Card collection is not enabled in this storefront.
      </SectionHeader>
      <CheckoutStepper active={4} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <MockPaymentPanel />
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
