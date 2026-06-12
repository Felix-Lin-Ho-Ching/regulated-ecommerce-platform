import Link from "next/link";
import { AppShell, CheckoutSummary, RestrictedProductBadge, SectionHeader } from "@/components/ui";

export default function Cart() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Cart" title="Cart review">
        Restricted-product checks happen before mock payment.
      </SectionHeader>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <div className="flex justify-between border-b pb-4">
            <div>
              <RestrictedProductBadge />
              <h2 className="mt-2 font-black">ArcGuard Restricted Knuckle Stun Device</h2>
              <p className="text-sm text-slate-600">
                Qty 1 · Requires destination compliance check
              </p>
            </div>
            <strong>$119.00</strong>
          </div>
          <div className="flex justify-between pt-4">
            <div>
              <h2 className="font-black">Guardian Rescue Alarm</h2>
              <p className="text-sm text-slate-600">Qty 1</p>
            </div>
            <strong>$29.00</strong>
          </div>
        </section>
        <div>
          <CheckoutSummary />
          <Link className="btn btn-primary mt-4 w-full" href="/checkout/address">
            Continue to shipping
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
