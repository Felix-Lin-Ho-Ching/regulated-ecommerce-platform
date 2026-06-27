"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { submitCheckoutAction } from "@/lib/checkout/actions";
import { evaluateCheckoutDestination, getRestrictedCategory, getRestrictedProductId } from "@/lib/checkout/eligibility";
import { money } from "@/lib/utils";

type AddressState = {
  email: string;
  firstName: string;
  lastName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

type AgeState = { month: string; day: string; year: string; verified: boolean; attested: boolean };

function isAdult({ year, month, day }: AgeState) {
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  return new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()) <= today;
}

export function OnePageCheckout({ cart, error, message }: { cart: CartSnapshot; error?: string; message?: string }) {
  const [address, setAddress] = useState<AddressState>({ email: "", firstName: "", lastName: "", line1: "", city: "", state: "", postalCode: "" });
  const [age, setAge] = useState<AgeState>({ month: "", day: "", year: "", verified: false, attested: false });
  const hasRestricted = cart.hasRestrictedItems;
  const addressComplete = Boolean(address.email && address.firstName && address.lastName && address.line1 && address.city && address.state && address.postalCode);
  const destination = useMemo(
    () => evaluateCheckoutDestination({ hasRestrictedItems: hasRestricted, productCategory: getRestrictedCategory(cart), productId: getRestrictedProductId(cart), state: address.state, postalCode: address.postalCode }),
    [address.state, address.postalCode, cart, hasRestricted],
  );
  const ageComplete = !hasRestricted || (age.verified && age.attested);
  const blocked = destination.status === "blocked";
  const canSubmit = addressComplete && destination.status === "allowed" && ageComplete;

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function updateAge(field: keyof AgeState, value: string | boolean) {
    setAge((current) => ({ ...current, verified: field === "attested" ? current.verified : false, [field]: value }));
  }

  return (
    <form action={submitCheckoutAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-5">
        {error === "address" ? <CheckoutNotice tone="warning">Complete your shipping address to continue.</CheckoutNotice> : null}
        {error === "blocked" ? <BlockedNotice /> : null}
        {error === "verification" ? <CheckoutNotice tone="warning">Age verification is required for restricted items.</CheckoutNotice> : null}
        {error === "stock" ? <CheckoutNotice tone="danger">{getSafeStockMessage(message)}</CheckoutNotice> : null}

        <section className="card p-5">
          <h2 className="text-xl font-black">Express checkout</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-sm font-bold text-slate-600">Express checkout options are not enabled for this order.</div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Contact</h2>
          <label className="mt-4 block text-sm font-bold">Email<input className="input mt-1" name="email" type="email" required onChange={(e) => updateAddress("email", e.target.value)} /></label>
          <label className="mt-3 flex gap-3 text-sm text-slate-700"><input name="marketingOptIn" type="checkbox" /> Email me with news and offers</label>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Delivery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold sm:col-span-2">Country/region<input className="input mt-1" name="country" readOnly value="United States" /></label>
            <label className="block text-sm font-bold">First name<input className="input mt-1" name="firstName" required onChange={(e) => updateAddress("firstName", e.target.value)} /></label>
            <label className="block text-sm font-bold">Last name<input className="input mt-1" name="lastName" required onChange={(e) => updateAddress("lastName", e.target.value)} /></label>
            <label className="block text-sm font-bold sm:col-span-2">Company <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="company" /></label>
            <label className="block text-sm font-bold sm:col-span-2">Address<input className="input mt-1" name="line1" required onChange={(e) => updateAddress("line1", e.target.value)} /></label>
            <label className="block text-sm font-bold sm:col-span-2">Apartment, suite, etc. <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="line2" /></label>
            <label className="block text-sm font-bold">City<input className="input mt-1" name="city" required onChange={(e) => updateAddress("city", e.target.value)} /></label>
            <label className="block text-sm font-bold">State<input className="input mt-1 uppercase" name="state" maxLength={2} required onChange={(e) => updateAddress("state", e.target.value)} /></label>
            <label className="block text-sm font-bold">ZIP code<input className="input mt-1" name="postalCode" required onChange={(e) => updateAddress("postalCode", e.target.value)} /></label>
            <label className="block text-sm font-bold">Phone <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="phone" /></label>
          </div>
          <label className="mt-4 flex gap-3 text-sm text-slate-700"><input name="saveInfo" type="checkbox" /> Save this information for next time</label>
        </section>

        <section className="card p-5"><h2 className="text-xl font-black">Shipping method</h2><ShippingMethod addressComplete={addressComplete} destination={destination} shipping={cart.shipping} /></section>
        <section className="card p-5"><h2 className="text-xl font-black">Order request</h2><PaymentBlock disabled={blocked} /></section>

        {hasRestricted ? (
          <section className="card p-5">
            <h2 className="text-xl font-black">Age verification</h2>
            <p className="mt-2 text-sm text-slate-600">Age verification is required for restricted items. Your date of birth is used only for this checkout check.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]"><input className="input" name="dobMonth" placeholder="MM" value={age.month} onChange={(e) => updateAge("month", e.target.value)} required /><input className="input" name="dobDay" placeholder="DD" value={age.day} onChange={(e) => updateAge("day", e.target.value)} required /><input className="input" name="dobYear" placeholder="YYYY" value={age.year} onChange={(e) => updateAge("year", e.target.value)} required /><button className="btn btn-secondary" type="button" onClick={() => setAge((current) => ({ ...current, verified: isAdult(current) }))}>Verify age</button></div>
            <label className="mt-4 flex gap-3 text-sm font-bold"><input name="ageAttestation" type="checkbox" checked={age.attested} onChange={(e) => updateAge("attested", e.target.checked)} /> I confirm I am at least 18 years old.</label>
            {age.verified ? <p className="mt-3 text-sm font-bold text-emerald-700">Age verified for checkout.</p> : null}
          </section>
        ) : null}

        {blocked ? <BlockedNotice /> : null}
        <button className="btn btn-primary w-full" disabled={!canSubmit} type="submit">Submit order request</button>
      </div>
      <OrderSummary cart={cart} />
    </form>
  );
}

function ShippingMethod({ addressComplete, destination, shipping }: { addressComplete: boolean; destination: { status: string; message: string }; shipping: number }) {
  if (!addressComplete) return <p className="mt-2 text-sm text-slate-600">Enter your shipping address to view available shipping methods.</p>;
  if (destination.status === "allowed") return <label className="mt-4 flex items-center justify-between rounded-2xl border border-teal-700 bg-teal-50 p-4 font-bold"><span>Standard shipping</span><span>{money(shipping)}</span></label>;
  return <p className="mt-2 text-sm font-bold text-amber-900">{destination.message}</p>;
}

function PaymentBlock({ disabled }: { disabled: boolean }) {
  return <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"><p className="font-bold text-slate-800">Payment is not collected online yet.</p><p className="mt-2 text-sm text-slate-600">Submit an order request now. We will contact you to complete payment if approved.</p><input type="hidden" name="paymentMode" value="order_request" /><fieldset disabled={disabled} className="mt-3"><label className="flex gap-3 text-sm font-bold"><input defaultChecked name="billingSame" type="checkbox" /> Use shipping address for order-request review</label></fieldset></div>;
}

function OrderSummary({ cart }: { cart: CartSnapshot }) { return <aside className="card h-fit p-5 lg:sticky lg:top-4"><h2 className="text-xl font-black">Order summary</h2><div className="mt-4 divide-y divide-stone-200">{cart.lines.map((line) => <div className="flex gap-3 py-3" key={line.product.slug}><div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-100 to-teal-100" /><div className="flex-1"><p className="font-black">{line.product.name}</p><p className="text-sm text-slate-600">Qty {line.quantity}</p></div><strong>{money(line.lineTotal)}</strong></div>)}</div><label className="mt-4 flex gap-2"><input className="input" placeholder="Discount code" /><button className="btn btn-secondary" type="button">Apply</button></label><dl className="mt-4 space-y-2 text-sm"><Row label="Subtotal" value={money(cart.subtotal)} /><Row label="Shipping" value={money(cart.shipping)} /><Row label="Estimated tax" value={money(cart.tax)} /><div className="flex justify-between border-t pt-3 text-lg font-black"><dt>Total</dt><dd>{money(cart.total)}</dd></div></dl></aside>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between"><dt>{label}</dt><dd>{value}</dd></div>; }
function BlockedNotice() { return <CheckoutNotice tone="danger">This item is not available for your shipping destination. <button className="underline" type="button">Change shipping address</button> or <Link className="underline" href="/cart">Remove restricted item</Link>.</CheckoutNotice>; }
function CheckoutNotice({ children, tone }: { children: React.ReactNode; tone: "warning" | "danger" }) { return <div className={`rounded-2xl border p-4 text-sm font-bold ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{children}</div>; }

function getSafeStockMessage(message?: string) {
  if (message && /^Only (\d+ available\.?|the currently available quantity can be requested\.)$/.test(message)) {
    return message;
  }

  return "Only the currently available quantity can be requested.";
}
