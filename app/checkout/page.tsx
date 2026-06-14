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
      <SectionHeader eyebrow="Checkout" title="Checkout">
        Review your cart, enter shipping, complete eligibility if needed, and submit your order.
      </SectionHeader>
      <CheckoutStepper active={1} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <section className="card p-5">
            <h2 className="text-xl font-black">Cart</h2>
            <p className="mt-2 text-sm text-slate-600">
              {getCartLineCount(cart)} item(s) are ready for checkout.
            </p>
            <Link className="btn btn-primary mt-4" href="/cart">
              Review cart
            </Link>
          </section>
          <section className="card p-5">
            <h2 className="text-xl font-black">Shipping</h2>
            <p className="mt-2 text-sm text-slate-600">
              Shipping details are used to calculate destination availability for restricted items.
            </p>
            <Link className="btn btn-secondary mt-4" href="/checkout/address">
              Enter shipping address
            </Link>
          </section>
          <EligibilityChecklist />
          <AlertPanel title="Payment" tone="warning">
            No card information is collected. Restricted items must pass checkout eligibility before the order can be submitted.
          </AlertPanel>
        </section>
        <CheckoutSummary cart={cart} />
      </div>
    </AppShell>
  );
}
