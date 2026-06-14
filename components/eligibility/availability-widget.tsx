"use client";

import { useState } from "react";
import { evaluateEligibility, type EligibilityResult } from "@/lib/eligibility/rules";

import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

export function AvailabilityWidget({ productCategory }: { productCategory: string }) {
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<EligibilityResult | null>(null);
  return (
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-black">Check availability</h2>
      <p className="mt-1 text-sm text-slate-600">Preview restricted-product availability by shipping destination. Final review happens during checkout.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-bold">State<select className="input" value={state} onChange={(event) => setState(event.target.value)}><option value="">Select</option>{US_STATE_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold">ZIP code (optional)<input className="input" inputMode="numeric" maxLength={10} value={zip} onChange={(event) => setZip(event.target.value)} /></label>
        <button className="btn btn-secondary self-end" onClick={() => setResult(evaluateEligibility({ state, zip, productCategory, restricted: true }))} type="button">Check</button>
      </div>
      {result ? <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="font-black">{result.label}</p><p className="mt-1 text-sm text-slate-600">{result.message}</p></div> : null}
    </section>
  );
}
