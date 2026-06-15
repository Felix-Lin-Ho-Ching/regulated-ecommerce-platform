"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { submitCheckoutAction } from "@/lib/checkout/actions";
import { money } from "@/lib/utils";

const blockedStates = new Set(["NY"]);
const reviewStates = new Set(["CA", "IL", "OR"]);

export function OnePageCheckout({ cart, error }: { cart: CartSnapshot; error?: string }) {
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState({ email: "", name: "", line1: "", city: "" });
  const [adult, setAdult] = useState(false);
  const [attested, setAttested] = useState(false);
  const hasRestricted = cart.hasRestrictedItems;
  const addressComplete = Boolean(address.email && address.name && address.line1 && address.city && state && zip);
  const destinationStatus = useMemo(() => {
    const code = state.trim().toUpperCase();
    if (!hasRestricted || !addressComplete) return "pending";
    if (blockedStates.has(code)) return "blocked";
    if (reviewStates.has(code)) return "verification";
    return "allowed";
  }, [addressComplete, hasRestricted, state]);
  const canSubmit = addressComplete && (!hasRestricted || (destinationStatus === "allowed" && adult && attested));

  return (
    <form action={submitCheckoutAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        {error === "address" ? <CheckoutNotice tone="warning">Complete your shipping address to continue.</CheckoutNotice> : null}
        {error === "blocked" ? <CheckoutNotice tone="danger">This item is not available for your shipping destination. Change shipping address or <Link className="underline" href="/cart">remove restricted item</Link>.</CheckoutNotice> : null}
        {error === "verification" ? <CheckoutNotice tone="warning">Verification is required before this order can be submitted.</CheckoutNotice> : null}

        <section className="card p-5">
          <h2 className="text-xl font-black">Contact information</h2>
          <label className="mt-4 block text-sm font-bold">Email<input className="input mt-1" name="email" type="email" required onChange={(e)=>setAddress({...address,email:e.target.value})} /></label>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Shipping address</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold sm:col-span-2">Full name<input className="input mt-1" name="name" required onChange={(e)=>setAddress({...address,name:e.target.value})} /></label>
            <label className="block text-sm font-bold sm:col-span-2">Address line 1<input className="input mt-1" name="line1" required onChange={(e)=>setAddress({...address,line1:e.target.value})} /></label>
            <label className="block text-sm font-bold sm:col-span-2">Address line 2 <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="line2" /></label>
            <label className="block text-sm font-bold">City<input className="input mt-1" name="city" required onChange={(e)=>setAddress({...address,city:e.target.value})} /></label>
            <label className="block text-sm font-bold">State<input className="input mt-1 uppercase" name="state" maxLength={2} required onChange={(e)=>setState(e.target.value)} /></label>
            <label className="block text-sm font-bold">ZIP code<input className="input mt-1" name="postalCode" required onChange={(e)=>setZip(e.target.value)} /></label>
            <label className="block text-sm font-bold">Phone <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="phone" /></label>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Shipping method</h2>
          {!addressComplete ? <p className="mt-2 text-sm text-slate-600">Enter your shipping address to view available shipping methods.</p> : destinationStatus === "allowed" || !hasRestricted ? <label className="mt-4 flex items-center justify-between rounded-2xl border border-teal-700 bg-teal-50 p-4 font-bold"><span>Standard shipping</span><span>{money(cart.shipping)}</span></label> : <p className="mt-2 text-sm font-bold text-amber-900">Shipping options are unavailable until destination eligibility is complete.</p>}
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black">Payment</h2>
          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700">Card details are not collected here. Your order can be submitted when checkout requirements are complete.</div>
        </section>

        {hasRestricted ? <section className="card p-5"><h2 className="text-xl font-black">Age verification</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><input className="input" name="dobMonth" placeholder="MM" onChange={()=>setAdult(true)} required/><input className="input" name="dobDay" placeholder="DD" required/><input className="input" name="dobYear" placeholder="YYYY" required/></div><label className="mt-4 flex gap-3 text-sm font-bold"><input name="ageAttestation" type="checkbox" onChange={(e)=>setAttested(e.target.checked)} /> I confirm I am at least 18 years old.</label></section> : null}

        <button className="btn btn-primary w-full" disabled={!canSubmit} type="submit">Submit order</button>
      </div>
      <aside className="card h-fit p-5 lg:sticky lg:top-4"><h2 className="text-xl font-black">Order summary</h2><div className="mt-4 divide-y divide-stone-200">{cart.lines.map((line)=><div className="flex gap-3 py-3" key={line.product.slug}><div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-100 to-teal-100"/><div className="flex-1"><p className="font-black">{line.product.name}</p><p className="text-sm text-slate-600">Qty {line.quantity}</p></div><strong>{money(line.lineTotal)}</strong></div>)}</div><dl className="mt-4 space-y-2 text-sm"><Row label="Subtotal" value={money(cart.subtotal)}/><Row label="Shipping" value={money(cart.shipping)}/><Row label="Tax" value={money(cart.tax)}/><div className="flex justify-between border-t pt-3 text-lg font-black"><dt>Total</dt><dd>{money(cart.total)}</dd></div></dl></aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between"><dt>{label}</dt><dd>{value}</dd></div>; }
function CheckoutNotice({ children, tone }: { children: React.ReactNode; tone: "warning" | "danger" }) { return <div className={`rounded-2xl border p-4 text-sm font-bold ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{children}</div>; }
