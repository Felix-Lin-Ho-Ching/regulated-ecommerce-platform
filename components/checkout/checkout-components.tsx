import { AlertPanel, StatusBadge } from "@/components/common/primitives";
import { checkoutCases } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/mock-data";

export function CheckoutStepper({ active = 1 }: { active?: number }) {
  const steps = ["Cart", "Shipping", "Eligibility", "Payment", "Confirmation"];
  const activeIndex = Math.min(Math.max(active, 1), steps.length);

  return (
    <ol className="grid gap-2 md:grid-cols-5" aria-label="Checkout progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        return (
          <li
            key={step}
            className={cn(
              "rounded-xl border p-3 text-xs font-black",
              stepNumber === activeIndex
                ? "border-teal-800 bg-teal-50"
                : stepNumber < activeIndex
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

export function CheckoutSummary() {
  return (
    <aside className="card p-5">
      <h2 className="text-lg font-black">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>$148.00</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>$12.00</dd>
        </div>
        <div className="flex justify-between">
          <dt>Estimated tax</dt>
          <dd>$11.84</dd>
        </div>
        <div className="flex justify-between border-t pt-3 text-lg font-black">
          <dt>Total</dt>
          <dd>$171.84</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-slate-500">
        No payment is collected until eligibility and verification checks are approved.
      </p>
    </aside>
  );
}

export function ComplianceResultPanel({ outcome }: { outcome: keyof typeof checkoutCases }) {
  const currentCase = checkoutCases[outcome];
  const tone = outcome === "blocked"
    ? "danger"
    : outcome.includes("pending")
      ? "warning"
      : outcome === "paid" || outcome === "ready_for_payment" || outcome === "allowed"
        ? "success"
        : "danger";

  return (
    <AlertPanel title={currentCase.title} tone={tone as StatusTone}>
      <p>{currentCase.reason}</p>
      <p className="mt-2">
        <strong>Destination:</strong> {currentCase.state} · <strong>Payment:</strong>{" "}
        {currentCase.payment} · <strong>Verification:</strong> {currentCase.verification}
      </p>
      {outcome === "blocked" ? (
        <p className="mt-2 font-bold">Payment button hidden because this shipment is not eligible.</p>
      ) : null}
    </AlertPanel>
  );
}

export function VerificationRequirementList() {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      <li>Confirm purchaser is at least 18 years old.</li>
      <li>Acknowledge restricted-product policy and destination-law review.</li>
      <li>Use a verified shipping address; freight forwarding is not supported.</li>
      <li>Submit documents only when the eligibility review requires them.</li>
    </ul>
  );
}

export function DocumentUploadCard() {
  return (
    <section className="card p-5">
      <h2 className="text-xl font-black">Required document upload</h2>
      <p className="mt-2 text-sm text-slate-600">
        Upload Government ID and proof of residence. Payment remains unavailable until review is approved.
      </p>
      <div className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <button className="btn btn-secondary focus-ring">Choose files</button>
        <p className="mt-2 text-xs text-slate-500">PDF, PNG, or JPG · mock upload only</p>
      </div>
      <StatusBadge tone="warning">Document review pending</StatusBadge>
    </section>
  );
}

export function OrderStatusTimeline({ paid = false }: { paid?: boolean }) {
  const items = [
    "Shipping entered",
    "Eligibility checked",
    paid ? "Payment paid" : "Payment not collected",
    "Confirmation recorded",
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
