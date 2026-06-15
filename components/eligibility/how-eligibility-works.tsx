"use client";

import { useState } from "react";

export function HowEligibilityWorksButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-secondary" onClick={() => setOpen(true)} type="button">How eligibility works</button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="eligibility-info-title">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-black" id="eligibility-info-title">How eligibility works</h2>
              <button className="rounded-full border px-3 py-1 text-sm font-bold" onClick={() => setOpen(false)} type="button">Close</button>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Restricted items ask for an age confirmation and shipping state/ZIP pre-check.</li>
              <li>The pre-check is only a shopping preview, not final legal approval.</li>
              <li>Unavailable destinations show “Not available in your area.”</li>
              <li>Some destinations require additional eligibility verification before payment.</li>
              <li>Checkout re-checks the full shipping address before any payment step.</li>
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
