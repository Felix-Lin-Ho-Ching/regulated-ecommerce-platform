"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicStateRequirement } from "@/lib/eligibility/public-state-requirements";

type Props = {
  requirements: PublicStateRequirement[];
};

const valueStyles: Record<PublicStateRequirement["legalForConsumerUsePossession"], string> = {
  YES: "border-emerald-200 bg-emerald-50 text-emerald-900",
  NO: "border-red-200 bg-red-50 text-red-900",
  "CHECK STATE GUIDANCE": "border-amber-200 bg-amber-50 text-amber-950",
};

function StateCheckIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-teal-50 p-8 shadow-sm">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-100/70" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-amber-100/70" />
      <div className="relative mx-auto max-w-md rounded-[1.75rem] bg-white/80 p-5 shadow-inner">
        <div className="grid grid-cols-8 gap-2" aria-hidden="true">
          {Array.from({ length: 48 }).map((_, index) => (
            <span
              className={`h-7 rounded-lg ${index % 11 === 0 ? "bg-teal-800" : index % 7 === 0 ? "bg-amber-300" : "bg-stone-200"}`}
              key={index}
            />
          ))}
        </div>
      </div>
      <div className="relative mt-8 rounded-2xl bg-white/90 p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">State requirements</p>
        <p className="mt-2 text-2xl font-black text-slate-950">Choose a state for a simple customer checklist.</p>
        <p className="mt-2 text-sm text-slate-600">Final purchase eligibility is checked again during checkout using your shipping destination.</p>
      </div>
    </div>
  );
}

function ChecklistRow({ label, value }: { label: string; value: PublicStateRequirement["legalForConsumerUsePossession"] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-black text-slate-950">{label}</span>
      <span className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-black ${valueStyles[value]}`}>{value}</span>
    </div>
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
          Select your state for plain-language shopping guidance before you compare Stun Fry self-defense products.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
        <StateCheckIllustration />
        <div className="card flex flex-col justify-center p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-800">Check your state</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Choose where you live or ship</h2>
          <p className="mt-3 text-slate-600">Use this guide as a starting point for state and local requirements. Checkout performs the final destination check.</p>
          <label className="mt-6 block text-sm font-black text-slate-800" htmlFor="state-selector">State</label>
          <select className="input mt-2 focus-ring" id="state-selector" onChange={(event) => setSelectedSlug(event.target.value)} value={selectedSlug}>
            <option value="">Select a state</option>
            {requirements.map((state) => <option key={state.stateCode} value={state.slug}>{state.stateName}</option>)}
          </select>
          <p className="mt-4 text-sm text-slate-500">Informational only. Check state and local laws. Final purchase eligibility is checked at checkout.</p>
        </div>
      </section>

      <section className="card p-6 md:p-8" aria-live="polite">
        {!selectedRequirement ? (
          <div className="text-center">
            <p className="text-lg font-black text-slate-950">Select your state to view the checklist.</p>
            <p className="mt-2 text-slate-600">Legal for consumer use/possession and other restrictions will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-slate-500">Selected state</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedRequirement.stateName}</h2>
              <p className="mt-3 text-slate-600">{selectedRequirement.publicSummary}</p>
              <Link className="btn btn-primary mt-5" href={`/my-state/${selectedRequirement.slug}`}>More info</Link>
            </div>
            <div className="space-y-3">
              <ChecklistRow label="Legal for Consumer Use/Possession" value={selectedRequirement.legalForConsumerUsePossession} />
              <ChecklistRow label="Other Restrictions" value={selectedRequirement.otherRestrictions} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
