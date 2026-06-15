"use client";

import { useMemo, useState } from "react";
import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

export type StateGuidance = {
  stateCode: string;
  status: "Available" | "Restricted" | "Manual review required" | "Not available for online purchase";
  checkoutNote: string;
  warning: string;
};

type Props = {
  guidance: StateGuidance[];
};

const statusStyles: Record<StateGuidance["status"], string> = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Restricted: "border-amber-200 bg-amber-50 text-amber-950",
  "Manual review required": "border-sky-200 bg-sky-50 text-sky-950",
  "Not available for online purchase": "border-red-200 bg-red-50 text-red-950",
};

function StateCheckIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-stone-50 to-teal-50 p-8 shadow-sm">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-100/70" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-amber-100/70" />
      <div className="relative mx-auto grid max-w-sm grid-cols-6 gap-2 rounded-[1.5rem] bg-white/80 p-5 shadow-inner">
        {Array.from({ length: 30 }).map((_, index) => (
          <span
            aria-hidden="true"
            className={`h-8 rounded-lg ${index % 7 === 0 ? "bg-teal-700" : index % 5 === 0 ? "bg-amber-300" : "bg-stone-200"}`}
            key={index}
          />
        ))}
      </div>
      <div className="relative mt-8 rounded-2xl bg-white/90 p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">State guidance</p>
        <p className="mt-2 text-2xl font-black text-slate-950">Simple shopping notes before checkout.</p>
        <p className="mt-2 text-sm text-slate-600">Availability can depend on destination rules and required verification.</p>
      </div>
    </div>
  );
}

export function MyStateChecker({ guidance }: Props) {
  const [selectedState, setSelectedState] = useState("");
  const selectedGuidance = useMemo(
    () => guidance.find((item) => item.stateCode === selectedState),
    [guidance, selectedState],
  );
  const selectedStateName = US_STATE_OPTIONS.find((state) => state.code === selectedState)?.name;

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-[.24em] text-teal-800">My State</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Check your state requirements</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Review simple purchase and shipping guidance for Stun Fry restricted products before you start checkout.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
        <StateCheckIllustration />
        <div className="card flex flex-col justify-center p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-800">Check your destination</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Select your shipping state</h2>
          <p className="mt-3 text-slate-600">
            We will translate the current rule settings into a customer-friendly availability note. Final checkout may still ask for age confirmation or review.
          </p>
          <label className="mt-6 block text-sm font-black text-slate-800" htmlFor="state-selector">
            Shipping state
          </label>
          <select
            className="input mt-2 focus-ring"
            id="state-selector"
            onChange={(event) => setSelectedState(event.target.value)}
            value={selectedState}
          >
            <option value="">Select a state</option>
            {US_STATE_OPTIONS.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <p className="mt-4 text-sm text-slate-500">This is shopping guidance, not legal advice. Restricted products remain subject to checkout controls.</p>
        </div>
      </section>

      <section className="card p-6 md:p-8" aria-live="polite">
        {!selectedGuidance ? (
          <div className="text-center">
            <p className="text-lg font-black text-slate-950">Select your state to view purchase and shipping guidance.</p>
            <p className="mt-2 text-slate-600">Results will appear here after you choose a shipping destination.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-slate-500">Selected state</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedStateName}</h2>
              <span className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-black ${statusStyles[selectedGuidance.status]}`}>
                {selectedGuidance.status}
              </span>
            </div>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-950">Checkout note</h3>
                <p className="mt-1">{selectedGuidance.checkoutNote}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <h3 className="font-black text-slate-950">Restricted-product warning</h3>
                <p className="mt-1 text-sm leading-6">{selectedGuidance.warning}</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
