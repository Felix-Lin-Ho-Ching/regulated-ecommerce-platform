import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  EligibilityChecklist,
  SectionHeader,
  AlertPanel,
} from "@/components/ui";

export default function Checkout() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Checkout" title="Secure checkout">
        Complete cart, shipping, eligibility, payment, and confirmation in a shopper-friendly flow.
      </SectionHeader>
      <CheckoutStepper active={1} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <section className="card p-5">
            <h2 className="text-xl font-black">Cart</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review selected products and restricted-product notices before entering shipping.
            </p>
            <Link className="btn btn-primary mt-4" href="/cart">
              Review cart
            </Link>
          </section>
          <section className="card p-5">
            <h2 className="text-xl font-black">Shipping</h2>
            <p className="mt-2 text-sm text-slate-600">
              Shipping details are used for address validation and destination eligibility checks.
            </p>
            <Link className="btn btn-secondary mt-4" href="/checkout/address">
              Enter shipping address
            </Link>
          </section>
          <EligibilityChecklist />
          <AlertPanel title="Payment remains unavailable until approval" tone="warning">
            Payment is mocked and live checkout is disabled. Shoppers only see payment actions after
            eligibility approval.
          </AlertPanel>
        </section>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
