import { checkoutCases, type StatusTone } from "@/lib/mock-data";
import { cn, money } from "@/lib/utils";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { AlertPanel } from "@/components/common/panels";
import { StatusBadge } from "@/components/common/badge";

const checkoutSteps = ["Cart", "Shipping", "Eligibility", "Payment", "Confirmation"];

export function CheckoutStepper({ active = 1 }: { active?: number }) {
  return (
    <ol className="grid gap-2 md:grid-cols-5" aria-label="Checkout progress">
      {checkoutSteps.map((step, index) => {
        const stepNumber = index + 1;
        return (
          <li
            key={step}
            className={cn(
              "rounded-xl border p-3 text-xs font-black",
              stepNumber === active
                ? "border-teal-800 bg-teal-50"
                : stepNumber < active
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-stone-200 bg-white",
            )}
          >
            <span className="block">Step {stepNumber}</span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutSummary({ cart }: { cart?: CartSnapshot }) {
  const subtotal = cart?.subtotal ?? 148;
  const shipping = cart?.shipping ?? 12;
  const tax = cart?.tax ?? 11.84;
  const total = cart?.total ?? 171.84;

  return (
    <aside className="card p-5">
      <h2 className="text-lg font-black">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{money(shipping)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Estimated tax</dt>
          <dd>{money(tax)}</dd>
        </div>
        <div className="flex justify-between border-t pt-3 text-lg font-black">
          <dt>Total</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-slate-500">
        Payment is available after checkout eligibility is complete.
      </p>
    </aside>
  );
}

export function ComplianceResultPanel({ outcome }: { outcome: keyof typeof checkoutCases }) {
  const checkoutCase = checkoutCases[outcome];
  const tone: StatusTone =
    outcome === "blocked"
      ? "danger"
      : outcome.includes("pending")
        ? "warning"
        : outcome === "paid" || outcome === "ready_for_payment" || outcome === "allowed"
          ? "success"
          : "danger";

  return (
    <AlertPanel title={checkoutCase.title} tone={tone}>
      <p>{checkoutCase.reason}</p>
      <p className="mt-2">
        <strong>Destination:</strong> {checkoutCase.state} · <strong>Payment:</strong>{" "}
        {checkoutCase.payment} · <strong>Verification:</strong> {checkoutCase.verification}
      </p>
      {outcome === "blocked" ? (
        <p className="mt-2 font-bold">
          Payment button hidden because this shipment is not eligible.
        </p>
      ) : null}
    </AlertPanel>
  );
}

export function VerificationRequirementList() {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      <li>Confirm purchaser is at least 18 years old when restricted items are in the cart.</li>
      <li>Acknowledge that shipping restrictions may apply.</li>
      <li>Use verified shipping address; freight forwarding is not allowed.</li>
      <li>Submit required information if verification is needed.</li>
    </ul>
  );
}

export function EligibilityChecklist() {
  const checks = [
    "Address validation",
    "State and destination eligibility rules",
    "Document requirements",
    "Payment readiness",
    "Risk rules and admin exceptions",
  ];

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black">Eligibility review</h2>
        <StatusBadge tone="warning">Required before payment</StatusBadge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        These checks are grouped for shoppers so the checkout stays simple while restricted-product
        safeguards remain visible.
      </p>
      <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        {checks.map((check) => (
          <li className="rounded-xl border border-stone-200 bg-stone-50 p-3 font-bold" key={check}>
            {check}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocumentUploadCard() {
  return (
    <section className="card p-5">
      <h2 className="text-xl font-black">Required document upload</h2>
      <p className="mt-2 text-sm text-slate-600">
        Upload Government ID and proof of residence. Payment remains unavailable until review is
        approved.
      </p>
      <div className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <button className="btn btn-secondary focus-ring">Choose files</button>
        <p className="mt-2 text-xs text-slate-500">PDF, PNG, or JPG</p>
      </div>
      <div className="mt-4">
        <StatusBadge tone="warning">Document review pending</StatusBadge>
      </div>
    </section>
  );
}

export function OrderStatusTimeline({ paid = false }: { paid?: boolean }) {
  const items = [
    "Address validated",
    "Compliance checked",
    "Documents reviewed",
    paid ? "Payment paid" : "Payment not collected",
    "Fulfillment pending",
  ];

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li className="flex gap-3" key={item}>
          <span className="badge bg-white">{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
