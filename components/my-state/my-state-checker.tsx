"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicChecklistValue, PublicStateRequirement } from "@/lib/eligibility/public-state-requirements";

type Props = {
  requirements: PublicStateRequirement[];
};

function ChecklistLine({ label, value }: { label: string; value: PublicChecklistValue }) {
  return (
    <p className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
      {label} <span className={value === "YES" ? "text-emerald-700" : "text-red-700"}>{value}</span>
    </p>
  );
}

export function MyStateChecker({ requirements }: Props) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const selectedRequirement = useMemo(
    () => requirements.find((item) => item.slug === selectedSlug),
    [requirements, selectedSlug],
  );

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-[.24em] text-teal-800">My State</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Check Your State’s Requirements</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Select your state for a simple Stun Fry customer checklist before checkout verifies your shipping destination.
        </p>
      </section>

      <section className="card mx-auto max-w-3xl p-6 text-center md:p-8">
        <label className="block text-sm font-black uppercase tracking-[.2em] text-teal-800" htmlFor="state-selector">State selector</label>
        <select className="input mx-auto mt-3 max-w-xl focus-ring" id="state-selector" onChange={(event) => setSelectedSlug(event.target.value)} value={selectedSlug}>
          <option value="">Select a state</option>
          {requirements.map((state) => <option key={state.stateCode} value={state.slug}>{state.stateName}</option>)}
        </select>
        <p className="mt-4 text-sm text-slate-500">Informational only. Review official state and local resources. Checkout performs the final destination check.</p>
      </section>

      <section className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm md:p-8" aria-live="polite">
        {!selectedRequirement ? (
          <div>
            <p className="text-lg font-black text-slate-950">Select your state to view YES/NO values.</p>
            <p className="mt-2 text-slate-600">Legal for consumer use/possession and other restrictions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-slate-500">Selected state</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedRequirement.stateName}</h2>
            </div>
            <div className="space-y-3">
              <ChecklistLine label="Legal for Consumer Use/Possession" value={selectedRequirement.legalForConsumerUsePossession} />
              <ChecklistLine label="Other Restrictions*" value={selectedRequirement.otherRestrictions} />
            </div>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600">{selectedRequirement.publicSummary}</p>
            <Link className="btn btn-primary" href={`/my-state/${selectedRequirement.slug}`}>More info</Link>
          </div>
        )}
      </section>
    </div>
  );
}
