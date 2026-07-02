"use client";

import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { estimateCheckoutTaxAction, evaluateCheckoutDestinationAction, submitCheckoutAction } from "@/lib/checkout/actions";
import type { CheckoutDestinationResult } from "@/lib/checkout/eligibility";
import { US_STATES } from "@/lib/checkout/us-states";
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

type DobStatus = "empty" | "invalid" | "underage" | "verified";
type BillingState = { same: boolean; firstName: string; lastName: string; line1: string; city: string; state: string; postalCode: string };
type PaymentState = { cardNumber: string; expiration: string; cvv: string; nameOnCard: string };

const ADDRESS_WARNING = "Complete your contact and shipping address before submitting.";
const BLOCKED_DESTINATION_WARNING = "This item is not available for your shipping destination. Change shipping address or remove restricted item.";
const PENDING_DESTINATION_WARNING = "Checking configured destination rules. Try again in a moment.";
const AGE_WARNING = "Enter a valid date of birth showing you are at least 18 years old.";

type CheckoutWarning = "address" | "blocked" | "pending" | "verification" | "tax" | null;

function warningFromError(error?: string): CheckoutWarning {
  if (error === "address" || error === "blocked" || error === "verification" || error === "tax") return error;
  return null;
}

function formatDateValue(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDob(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dob = new Date(year, month - 1, day);
  if (Number.isNaN(dob.getTime()) || dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) return null;
  return dob;
}

function getDobStatus(value: string): DobStatus {
  if (!value) return "empty";
  const dob = parseDob(value);
  if (!dob) return "invalid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today || dob.getFullYear() < 1900) return "invalid";
  const adultDate = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return adultDate <= today ? "verified" : "underage";
}

function getDobMessage(status: DobStatus) {
  if (status === "verified") return "Age verified for checkout.";
  if (status === "underage") return "You must be at least 18 years old to buy restricted items.";
  if (status === "invalid") return "Enter a valid date of birth.";
  return "Select your date of birth.";
}

export function OnePageCheckout({ cart, error, message, paymentMode }: { cart: CartSnapshot; error?: string; message?: string; paymentMode?: string }) {
  const router = useRouter();
  const [address, setAddress] = useState<AddressState>({ email: "", firstName: "", lastName: "", line1: "", city: "", state: "", postalCode: "" });
  const [dob, setDob] = useState("");
  const [billing, setBilling] = useState<BillingState>({ same: true, firstName: "", lastName: "", line1: "", city: "", state: "", postalCode: "" });
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
  const isMockCard = paymentMode === "mock_card";
  const dobStatus = getDobStatus(dob);
  const ageComplete = !hasRestricted || dobStatus === "verified";
  const paymentComplete = !isMockCard || Boolean(payment.cardNumber && payment.expiration && payment.cvv && payment.nameOnCard);
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

    setCheckoutWarning(null);
    setIsSubmitting(true);
  }

  return (
    <form action={submitCheckoutAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]" noValidate onSubmit={handleSubmit}>
      <div className="space-y-5">
        {visibleCheckoutWarning ? <CheckoutWarningNotice warning={visibleCheckoutWarning} /> : null}
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
            <label className="block text-sm font-bold">State<StateSelect name="state" value={address.state} onChange={(value) => updateAddress("state", value)} /></label>
            <label className="block text-sm font-bold">ZIP code<input className="input mt-1" name="postalCode" required onChange={(e) => updateAddress("postalCode", e.target.value)} /></label>
            <label className="block text-sm font-bold">Phone <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="phone" /></label>
          </div>
          <label className="mt-4 flex gap-3 text-sm text-slate-700"><input name="saveInfo" type="checkbox" /> Save this information for next time</label>
        </section>

        <section className="card p-5"><h2 className="text-xl font-black">Shipping method</h2><ShippingMethod addressComplete={addressComplete} destination={destination} shipping={cart.shipping} pending={isDestinationPending} /></section>
        <section className="card p-5"><h2 className="text-xl font-black">Payment</h2><PaymentBlock disabled={blocked} isMockCard={isMockCard} payment={payment} setPayment={setPayment} billing={billing} setBilling={setBilling} /></section>

        {hasRestricted ? (
          <section className="card p-5">
            <h2 className="text-xl font-black">Age verification</h2>
            <p className="mt-2 text-sm text-slate-600">Date of birth is required for restricted items. It is used for this checkout eligibility check.</p>
            <DobPicker value={dob} onChange={(value) => { setCheckoutWarning(null); setDob(value); }} status={dobStatus} />
          </section>
        ) : null}

        <button className="btn btn-primary w-full" disabled={isSubmitting} type="submit">Submit order request</button>
      </div>
      <OrderSummary cart={cart} taxEstimate={taxEstimate} taxError={taxError} />
    </form>
  );
}

function StateSelect({ name, value, onChange, required = true }: { name: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <select className="input mt-1" name={name} required={required} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select state</option>
      {US_STATES.map((state) => <option key={state.code} value={state.code}>{state.code} — {state.name}</option>)}
    </select>
  );
}

function DobPicker({ value, onChange, status }: { value: string; onChange: (value: string) => void; status: DobStatus }) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const parsed = parseDob(value);
  const initialYear = parsed?.getFullYear() ?? currentYear - 18;
  const initialMonth = (parsed?.getMonth() ?? 0) + 1;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const pickerId = useId();
  const messageId = `${pickerId}-message`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => Array.from({ length: currentYear - 1900 + 1 }, (_, index) => currentYear - index), [currentYear]);
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const message = getDobMessage(status);
  const isError = status === "invalid" || status === "underage";

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function chooseDay(day: number) {
    const next = formatDateValue(viewYear, viewMonth, day);
    onChange(next);
    setOpen(false);
  }

  function syncNativeDate(next: string) {
    const nextDate = parseDob(next);
    if (nextDate) {
      setViewYear(nextDate.getFullYear());
      setViewMonth(nextDate.getMonth() + 1);
    }
    onChange(next);
  }

  return <div className="mt-4" ref={popoverRef}>
    <label className="block text-sm font-bold" htmlFor={pickerId}>Date of birth</label>
    <input name="dob" type="hidden" value={value} />
    <input aria-describedby={messageId} className="input mt-1 md:hidden" id={`${pickerId}-native`} max={formatDateValue(currentYear, today.getMonth() + 1, today.getDate())} min="1900-01-01" type="date" value={value} onChange={(event) => syncNativeDate(event.target.value)} />
    <button aria-describedby={messageId} aria-expanded={open} aria-haspopup="dialog" className="input mt-1 hidden w-full text-left md:block" id={pickerId} type="button" onClick={() => setOpen((current) => !current)}>
      {value || "Select YYYY-MM-DD"}
    </button>
    {open ? <div aria-label="Choose date of birth" className="absolute z-20 mt-2 w-[min(100%,24rem)] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl" role="dialog">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-bold">Year<select className="input mt-1" value={viewYear} onChange={(event) => setViewYear(Number(event.target.value))}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <label className="text-sm font-bold">Month<select className="input mt-1" value={viewMonth} onChange={(event) => setViewMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" })}</option>)}</select></label>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dayValue = formatDateValue(viewYear, viewMonth, day);
        const disabled = getDobStatus(dayValue) === "invalid";
        return <button aria-label={dayValue} className={`rounded-lg p-2 text-sm font-bold ${value === dayValue ? "bg-teal-700 text-white" : "bg-stone-50 text-slate-800 hover:bg-amber-100"} disabled:cursor-not-allowed disabled:opacity-40`} disabled={disabled} key={dayValue} type="button" onClick={() => chooseDay(day)}>{day}</button>;
      })}</div>
    </div> : null}
    <p className={`mt-3 text-sm font-bold ${status === "verified" ? "text-emerald-700" : isError ? "text-red-700" : "text-slate-600"}`} id={messageId}>{message}</p>
  </div>;
}

function ShippingMethod({ addressComplete, destination, shipping, pending }: { addressComplete: boolean; destination: { status: string; message: string }; shipping: number; pending: boolean }) {
  if (!addressComplete) return <p className="mt-2 text-sm text-slate-600">Enter your shipping address to view available shipping methods.</p>;
  if (pending) return <p className="mt-2 text-sm text-slate-600">Checking configured destination rules…</p>;
  if (destination.status === "allowed") return <label className="mt-4 flex items-center justify-between rounded-2xl border border-teal-700 bg-teal-50 p-4 font-bold"><span>Standard shipping</span><span>{money(shipping)}</span></label>;
  return <p className="mt-2 text-sm font-bold text-amber-900">{destination.message}</p>;
}

function PaymentBlock({ disabled, isMockCard, payment, setPayment, billing, setBilling }: { disabled: boolean; isMockCard: boolean; payment: PaymentState; setPayment: Dispatch<SetStateAction<PaymentState>>; billing: BillingState; setBilling: Dispatch<SetStateAction<BillingState>> }) {
  if (!isMockCard) return <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"><p className="font-bold text-slate-800">Payment is not collected online yet.</p><p className="mt-2 text-sm text-slate-600">Submit an order request now. Allowed requests automatically become ready for a future payment step; payment is not collected and fulfillment is not released.</p><input type="hidden" name="paymentMode" value="order_request" /></div>;
  const updatePayment = (field: keyof PaymentState, value: string) => setPayment((current) => ({ ...current, [field]: value }));
  const updateBilling = (field: keyof BillingState, value: string | boolean) => setBilling((current) => ({ ...current, [field]: value }));
  return <fieldset disabled={disabled} className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
    <input type="hidden" name="paymentMode" value="mock_card" />
    <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">Test payment mode: use mock card numbers. No real payment is processed.</p>
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
      <label className="block text-sm font-bold sm:col-span-2">Billing address line 2 <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="billingLine2" /></label>
      <label className="block text-sm font-bold">Billing city<input className="input mt-1" name="billingCity" required value={billing.city} onChange={(e) => updateBilling("city", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing state<StateSelect name="billingState" value={billing.state} onChange={(value) => updateBilling("state", value)} /></label>
      <label className="block text-sm font-bold">Billing ZIP code<input className="input mt-1" name="billingPostalCode" required value={billing.postalCode} onChange={(e) => updateBilling("postalCode", e.target.value)} /></label>
      <label className="block text-sm font-bold">Billing country<input className="input mt-1" name="billingCountry" readOnly value="United States" /></label>
      <label className="block text-sm font-bold sm:col-span-2">Billing phone <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="billingPhone" /></label>
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
