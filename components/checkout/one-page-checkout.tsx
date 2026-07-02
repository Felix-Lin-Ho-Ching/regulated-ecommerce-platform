"use client";

import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { estimateCheckoutTaxAction, evaluateCheckoutDestinationAction, submitCheckoutAction } from "@/lib/checkout/actions";
import type { CheckoutDestinationResult } from "@/lib/checkout/eligibility";
import { money } from "@/lib/utils";
import { createPaymentOpaqueData } from "@/lib/payments/client/create-payment-opaque-data";

type AddressState = {
  email: string;
  firstName: string;
  lastName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

type AgeState = { month: string; day: string; year: string };
type BillingState = { same: boolean; firstName: string; lastName: string; line1: string; line2: string; city: string; state: string; postalCode: string; phone: string };
type PaymentState = { cardNumber: string; expiration: string; cvv: string; nameOnCard: string };

const ADDRESS_WARNING = "Complete your contact and shipping address before submitting.";
const BLOCKED_DESTINATION_WARNING = "This item is not available for your shipping destination. Change shipping address or remove restricted item.";
const PENDING_DESTINATION_WARNING = "Checking configured destination rules. Try again in a moment.";
const AGE_WARNING = "Age verification is required for restricted items.";

type CheckoutWarning = "address" | "blocked" | "pending" | "verification" | "tax" | null;

function warningFromError(error?: string): CheckoutWarning {
  if (error === "address" || error === "blocked" || error === "verification" || error === "tax") return error;
  return null;
}

function isAdult({ year, month, day }: AgeState) {
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  return new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()) <= today;
}

export function OnePageCheckout({ cart, error, message }: { cart: CartSnapshot; error?: string; message?: string }) {
  const router = useRouter();
  const [address, setAddress] = useState<AddressState>({ email: "", firstName: "", lastName: "", line1: "", city: "", state: "", postalCode: "" });
  const [age, setAge] = useState<AgeState>({ month: "", day: "", year: "" });
  const [billing, setBilling] = useState<BillingState>({ same: true, firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "" });
  const [payment, setPayment] = useState<PaymentState>({ cardNumber: "", expiration: "", cvv: "", nameOnCard: "" });
  const [destination, setDestination] = useState<CheckoutDestinationResult>({ status: "pending", message: "Enter your shipping address to view available shipping methods." });
  const [isDestinationPending, setIsDestinationPending] = useState(false);
  const [checkoutWarning, setCheckoutWarning] = useState<CheckoutWarning>(() => warningFromError(error));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxEstimate, setTaxEstimate] = useState<{ taxCents: number; totalCents: number; provider: string } | null>(null);
  const [taxError, setTaxError] = useState<string | null>(null);
  const hasRestricted = cart.hasRestrictedItems;
  const addressComplete = Boolean(address.email && address.firstName && address.lastName && address.line1 && address.city && address.state && address.postalCode);

  useEffect(() => {
    if (!address.state || !address.postalCode) {
      setIsDestinationPending(false);
      setDestination({ status: "pending", message: "Enter your shipping address to view available shipping methods." });
      return;
    }

    let current = true;
    setIsDestinationPending(true);
    void evaluateCheckoutDestinationAction({ state: address.state, postalCode: address.postalCode })
      .then((result) => {
        if (current) setDestination(result);
      })
      .finally(() => {
        if (current) setIsDestinationPending(false);
      });

    return () => {
      current = false;
    };
  }, [address.state, address.postalCode]);

  useEffect(() => {
    if (!addressComplete || destination.status !== "allowed") {
      setTaxEstimate(null);
      setTaxError(null);
      return;
    }
    let current = true;
    setTaxError(null);
    void estimateCheckoutTaxAction({ line1: address.line1, city: address.city, state: address.state, postalCode: address.postalCode })
      .then((result) => {
        if (!current) return;
        if (result.ok) setTaxEstimate({ taxCents: result.taxCents, totalCents: result.totalCents, provider: result.provider });
        else { setTaxEstimate(null); setTaxError(result.error); }
      })
      .catch(() => { if (current) { setTaxEstimate(null); setTaxError("Tax calculation is unavailable. Payment is blocked until tax can be calculated."); } });
    return () => { current = false; };
  }, [addressComplete, address.line1, address.city, address.state, address.postalCode, destination.status]);
  const ageComplete = !hasRestricted || isAdult(age);
  const paymentComplete = Boolean(payment.cardNumber && payment.expiration && payment.cvv && payment.nameOnCard);
  const billingComplete = billing.same || Boolean(billing.firstName && billing.lastName && billing.line1 && billing.city && billing.state && billing.postalCode);
  const blocked = destination.status === "blocked";
  const visibleCheckoutWarning = blocked ? "blocked" : checkoutWarning === "blocked" && destination.status === "allowed" ? null : checkoutWarning;

  function updateAddress(field: keyof AddressState, value: string) {
    if (field === "state" || field === "postalCode") {
      setCheckoutWarning(null);
      if (error === "address" || error === "blocked" || error === "verification") router.replace("/checkout");
    }
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function updateAge(field: keyof AgeState, value: string | boolean) {
    setCheckoutWarning(null);
    setAge((current) => ({ ...current, [field]: String(value) }));
  }

  function getCheckoutWarning() {
    if (!addressComplete) return "address";
    if (isDestinationPending) return "pending";
    if (blocked) return "blocked";
    if (!ageComplete) return "verification";
    if (taxError) return "tax";
    if (!taxEstimate) return "pending";
    if (!paymentComplete || !billingComplete) return "address";
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const warning = getCheckoutWarning();
    if (warning) {
      event.preventDefault();
      setCheckoutWarning(warning);
      return;
    }

    const [expirationMonth, expirationYear] = payment.expiration.split("/").map((part) => part.trim());
    const billingAddress = billing.same ? { firstName: address.firstName, lastName: address.lastName, line1: address.line1, city: address.city, state: address.state, postalCode: address.postalCode, country: "US" } : { firstName: billing.firstName, lastName: billing.lastName, line1: billing.line1, line2: billing.line2 || undefined, city: billing.city, state: billing.state, postalCode: billing.postalCode, country: "US", phone: billing.phone || undefined };
    const tokenized = createPaymentOpaqueData({ cardNumber: payment.cardNumber, expirationMonth: expirationMonth || "", expirationYear: expirationYear || "", cvv: payment.cvv, nameOnCard: payment.nameOnCard, billingAddress });
    const form = event.currentTarget;
    (form.elements.namedItem("opaqueData") as HTMLInputElement).value = JSON.stringify(tokenized.opaqueData);
    (form.elements.namedItem("cardSummary") as HTMLInputElement).value = JSON.stringify(tokenized.cardSummary);
    ["cardNumber", "cardExpiration", "cardCvv", "nameOnCard"].forEach((name) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | null;
      if (field) field.disabled = true;
    });
    setCheckoutWarning(null);
    setIsSubmitting(true);
  }

  return (
    <form action={submitCheckoutAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]" noValidate onSubmit={handleSubmit}>
      <div className="space-y-5">
        {visibleCheckoutWarning ? <CheckoutWarningNotice warning={visibleCheckoutWarning} /> : null}
        {error === "stock" ? <CheckoutNotice tone="danger">{getSafeStockMessage(message)}</CheckoutNotice> : null}

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

        <section className="card p-5"><h2 className="text-xl font-black">Shipping method</h2><ShippingMethod addressComplete={addressComplete} destination={destination} shipping={cart.shipping} pending={isDestinationPending} /></section>
        <section className="card p-5"><h2 className="text-xl font-black">Payment</h2><PaymentBlock disabled={blocked} payment={payment} setPayment={setPayment} billing={billing} setBilling={setBilling} /></section>

        {hasRestricted ? (
          <section className="card p-5">
            <h2 className="text-xl font-black">Age verification</h2>
            <p className="mt-2 text-sm text-slate-600">Date of birth is required for restricted items. It is used for this checkout eligibility check.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><input className="input" name="dobMonth" placeholder="MM" value={age.month} onChange={(e) => updateAge("month", e.target.value)} required /><input className="input" name="dobDay" placeholder="DD" value={age.day} onChange={(e) => updateAge("day", e.target.value)} required /><input className="input" name="dobYear" placeholder="YYYY" value={age.year} onChange={(e) => updateAge("year", e.target.value)} required /></div>
          </section>
        ) : null}

        <button className="btn btn-primary w-full" disabled={isSubmitting} type="submit">Pay now</button>
      </div>
      <OrderSummary cart={cart} taxEstimate={taxEstimate} taxError={taxError} />
    </form>
  );
}

function ShippingMethod({ addressComplete, destination, shipping, pending }: { addressComplete: boolean; destination: { status: string; message: string }; shipping: number; pending: boolean }) {
  if (!addressComplete) return <p className="mt-2 text-sm text-slate-600">Enter your shipping address to view available shipping methods.</p>;
  if (pending) return <p className="mt-2 text-sm text-slate-600">Checking configured destination rules…</p>;
  if (destination.status === "allowed") return <label className="mt-4 flex items-center justify-between rounded-2xl border border-teal-700 bg-teal-50 p-4 font-bold"><span>Standard shipping</span><span>{money(shipping)}</span></label>;
  return <p className="mt-2 text-sm font-bold text-amber-900">{destination.message}</p>;
}

function PaymentBlock({ disabled, payment, setPayment, billing, setBilling }: { disabled: boolean; payment: PaymentState; setPayment: Dispatch<SetStateAction<PaymentState>>; billing: BillingState; setBilling: Dispatch<SetStateAction<BillingState>> }) {
  const updatePayment = (field: keyof PaymentState, value: string) => setPayment((current) => ({ ...current, [field]: value }));
  const updateBilling = (field: keyof BillingState, value: string | boolean) => setBilling((current) => ({ ...current, [field]: value }));
  return <fieldset disabled={disabled} className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
    <input type="hidden" name="opaqueData" />
    <input type="hidden" name="cardSummary" />
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-bold sm:col-span-2">Card number<input autoComplete="cc-number" className="input mt-1" name="cardNumber" inputMode="numeric" required value={payment.cardNumber} onChange={(e) => updatePayment("cardNumber", e.target.value)} /></label>
      <label className="block text-sm font-bold">Expiration date MM/YY<input autoComplete="cc-exp" className="input mt-1" name="cardExpiration" placeholder="MM/YY" required value={payment.expiration} onChange={(e) => updatePayment("expiration", e.target.value)} /></label>
      <label className="block text-sm font-bold">Security code<input autoComplete="cc-csc" className="input mt-1" name="cardCvv" inputMode="numeric" required value={payment.cvv} onChange={(e) => updatePayment("cvv", e.target.value)} /></label>
      <label className="block text-sm font-bold sm:col-span-2">Name on card<input autoComplete="cc-name" className="input mt-1" name="nameOnCard" required value={payment.nameOnCard} onChange={(e) => updatePayment("nameOnCard", e.target.value)} /></label>
    </div>
    <label className="flex gap-3 text-sm font-bold"><input checked={billing.same} name="billingSame" type="checkbox" onChange={(e) => updateBilling("same", e.target.checked)} /> Use shipping address as billing address</label>
    {!billing.same ? <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-bold">Billing first name<input className="input mt-1" name="billingFirstName" required value={billing.firstName} onChange={(e) => updateBilling("firstName", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing last name<input className="input mt-1" name="billingLastName" required value={billing.lastName} onChange={(e) => updateBilling("lastName", e.target.value)} /></label>
      <label className="block text-sm font-bold sm:col-span-2">Billing address line 1<input className="input mt-1" name="billingLine1" required value={billing.line1} onChange={(e) => updateBilling("line1", e.target.value)} /></label>
      <label className="block text-sm font-bold sm:col-span-2">Billing address line 2 <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="billingLine2" value={billing.line2} onChange={(e) => updateBilling("line2", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing city<input className="input mt-1" name="billingCity" required value={billing.city} onChange={(e) => updateBilling("city", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing state<input className="input mt-1 uppercase" name="billingState" maxLength={2} required value={billing.state} onChange={(e) => updateBilling("state", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing ZIP code<input className="input mt-1" name="billingPostalCode" required value={billing.postalCode} onChange={(e) => updateBilling("postalCode", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing country<input className="input mt-1" name="billingCountry" readOnly value="United States" /></label>
      <label className="block text-sm font-bold sm:col-span-2">Billing phone <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="billingPhone" value={billing.phone} onChange={(e) => updateBilling("phone", e.target.value)} /></label>
    </div> : null}
  </fieldset>;
}

function OrderSummary({ cart, taxEstimate, taxError }: { cart: CartSnapshot; taxEstimate: { taxCents: number; totalCents: number; provider: string } | null; taxError: string | null }) { const estimatedTax = taxEstimate ? taxEstimate.taxCents / 100 : cart.tax; const total = taxEstimate ? taxEstimate.totalCents / 100 : cart.total; return <aside className="card h-fit p-5 lg:sticky lg:top-4"><h2 className="text-xl font-black">Order summary</h2><div className="mt-4 divide-y divide-stone-200">{cart.lines.map((line) => <div className="flex gap-3 py-3" key={line.product.slug}><div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-100 to-teal-100" /><div className="flex-1"><p className="font-black">{line.product.name}</p><p className="text-sm text-slate-600">Qty {line.quantity}</p></div><strong>{money(line.lineTotal)}</strong></div>)}</div><label className="mt-4 flex gap-2"><input className="input" placeholder="Discount code" /><button className="btn btn-secondary" type="button">Apply</button></label>{taxError ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-900">{taxError}</p> : null}<dl className="mt-4 space-y-2 text-sm"><Row label="Subtotal" value={money(cart.subtotal)} /><Row label="Shipping" value={money(cart.shipping)} /><Row label={taxEstimate ? `Estimated tax (${taxEstimate.provider})` : "Estimated tax after address"} value={taxEstimate ? money(estimatedTax) : "—"} /><div className="flex justify-between border-t pt-3 text-lg font-black"><dt>Total</dt><dd>{taxEstimate ? money(total) : money(cart.total)}</dd></div></dl></aside>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between"><dt>{label}</dt><dd>{value}</dd></div>; }
function BlockedNotice() { return <CheckoutNotice tone="danger">{BLOCKED_DESTINATION_WARNING}</CheckoutNotice>; }
function CheckoutWarningNotice({ warning }: { warning: Exclude<CheckoutWarning, null> }) {
  if (warning === "blocked") return <BlockedNotice />;
  if (warning === "address") return <CheckoutNotice tone="warning">{ADDRESS_WARNING}</CheckoutNotice>;
  if (warning === "pending") return <CheckoutNotice tone="warning">{PENDING_DESTINATION_WARNING}</CheckoutNotice>;
  if (warning === "tax") return <CheckoutNotice tone="danger">Tax calculation is unavailable. Payment is blocked until tax can be calculated.</CheckoutNotice>;
  return <CheckoutNotice tone="warning">{AGE_WARNING}</CheckoutNotice>;
}
function CheckoutNotice({ children, tone }: { children: React.ReactNode; tone: "warning" | "danger" }) { return <div className={`rounded-2xl border p-4 text-sm font-bold ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{children}</div>; }

function getSafeStockMessage(message?: string) {
  if (message && /^Only (\d+ available\.?|the currently available quantity can be requested\.)$/.test(message)) {
    return message;
  }

  return "Only the currently available quantity can be requested.";
}
