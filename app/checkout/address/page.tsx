import { AppShell, CheckoutStepper, CheckoutSummary, SectionHeader } from "@/components/ui";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getShippingDraft } from "@/lib/orders/order-service";

export default async function Address() {
  const [cart, shipping] = await Promise.all([getCartSnapshot(), getShippingDraft()]);

  return (
    <AppShell>
      <SectionHeader eyebrow="Shipping" title="Shipping address">
        Enter the destination used for age attestation, restricted-product review, and checkout review.
      </SectionHeader>
      <CheckoutStepper active={2} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <ShippingForm shipping={shipping} />
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
