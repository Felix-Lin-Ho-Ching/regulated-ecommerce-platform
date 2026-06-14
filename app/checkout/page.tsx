import Link from "next/link";
import {
  AlertPanel,
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  EligibilityChecklist,
  SectionHeader,
} from "@/components/ui";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getCartLineCount } from "@/lib/orders/order-service";

export default async function Checkout() {
  const cart = await getCartSnapshot();

  return (
    <AppShell>
      <SectionHeader eyebrow="Checkout" title="Checkout review">
        Review your cart, shipping details, and restricted-product eligibility before payment is available.
      </SectionHeader>
      <CheckoutStepper active={1} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <section className="card p-5">
            <h2 className="text-xl font-black">Cart</h2>
            <p className="mt-2 text-sm text-slate-600">
              {getCartLineCount(cart)} item(s) are ready for restricted-product review before
              checkout continues.
            </p>
            <Link className="btn btn-primary mt-4" href="/cart">
              Review cart
            </Link>
          </section>
          <section className="card p-5">
            <h2 className="text-xl font-black">Shipping</h2>
            <p className="mt-2 text-sm text-slate-600">
              Shipping details are used for destination review. No external address API is
              called.
            </p>
            <Link className="btn btn-secondary mt-4" href="/checkout/address">
              Enter shipping address
            </Link>
          </section>
          <EligibilityChecklist />
          <AlertPanel title="Payment unavailable in this environment" tone="warning">
            This storefront does not collect card data. Restricted items must pass shipping-address and eligibility review before any payment step can be offered.
          </AlertPanel>
        </section>
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
