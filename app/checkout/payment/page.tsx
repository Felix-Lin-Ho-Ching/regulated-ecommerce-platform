import { AppShell, CheckoutStepper, CheckoutSummary, SectionHeader } from "@/components/ui";
import { MockPaymentPanel } from "@/components/checkout/mock-payment-panel";
import { getCartSnapshot } from "@/lib/cart/cart-service";

export default async function Payment() {
  const cart = await getCartSnapshot();

  return (
    <AppShell>
      <SectionHeader eyebrow="Payment" title="Mock payment">
        This step creates a local mock order only. No real payment provider, card collection, or live
        checkout is present.
      </SectionHeader>
      <CheckoutStepper active={4} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <MockPaymentPanel />
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
