"use client";

import { useEffect, useMemo, useState } from "react";
import type { StorefrontContent } from "@/lib/storefront-content/defaults";
import { evaluateEligibility, type EligibilityResult } from "@/lib/eligibility/rules";
import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

const STORAGE_KEY = "stunfry.restrictedEligibilityPrecheck.v1";

type StoredEligibilityPrecheck = {
  isAtLeast18: boolean;
  state: string;
  zip: string;
  acknowledged: boolean;
  result: EligibilityResult;
  checkedAt: string;
};

function isCompletedPrecheck(value: StoredEligibilityPrecheck | null) {
  return Boolean(
    value?.isAtLeast18 !== undefined &&
      value.state &&
      value.acknowledged &&
      value.result?.status &&
      value.checkedAt,
  );
}

function readStoredPrecheck(): StoredEligibilityPrecheck | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredEligibilityPrecheck;
    return isCompletedPrecheck(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function EligibilityModal({
  content,
  trigger = "entry",
  productCategory,
}: {
  content: StorefrontContent;
  trigger?: "entry" | "restricted" | "checkout";
  productCategory?: string;
}) {
  const [open, setOpen] = useState(false);
  const [ageSelection, setAgeSelection] = useState<"" | "adult" | "under18">("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  useEffect(() => {
    if (!readStoredPrecheck()) setOpen(true);
  }, []);

  const isAtLeast18 = ageSelection === "adult";
  const canComplete = Boolean(ageSelection && state && acknowledged);

  const preview = useMemo(
    () => evaluateEligibility({ state, zip, isAtLeast18, productCategory, restricted: true }),
    [state, zip, isAtLeast18, productCategory],
  );

  function submit() {
    if (!canComplete) return;
    const next = evaluateEligibility({ state, zip, isAtLeast18, productCategory, restricted: true });
    setResult(next);
    const payload: StoredEligibilityPrecheck = {
      isAtLeast18,
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
      acknowledged,
      result: next,
      checkedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (next.status === "available") setOpen(false);
  }

  if (!open) return null;

  const shownResult = result ?? (state ? preview : null);

  return (
    <div
      aria-labelledby={`${trigger}-eligibility-title`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-teal-900">Restricted-product pre-check</p>
            <h2 className="mt-2 text-2xl font-black" id={`${trigger}-eligibility-title`}>
              {content.eligibilityPopupTitle}
            </h2>
          </div>
          <button
            className="rounded-full border px-3 py-1 text-sm font-bold"
            onClick={() => {
              window.location.href = "about:blank";
            }}
            type="button"
          >
            Leave site
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{content.eligibilityPopupBody}</p>
        <div className="mt-5 grid gap-4">
          <fieldset className="grid gap-2 text-sm font-bold">
            <legend>Age confirmation</legend>
            <label className="flex items-start gap-3">
              <input
                checked={ageSelection === "adult"}
                className="mt-1"
                name={`${trigger}-age`}
                onChange={() => setAgeSelection("adult")}
                type="radio"
              />
              {content.eligibilityAgeConfirmationText}
            </label>
            <label className="flex items-start gap-3">
              <input
                checked={ageSelection === "under18"}
                className="mt-1"
                name={`${trigger}-age`}
                onChange={() => setAgeSelection("under18")}
                type="radio"
              />
              I am under 18.
            </label>
          </fieldset>
          <label className="grid gap-2 text-sm font-bold">
            {content.eligibilityStateLabel}
            <select className="input" value={state} onChange={(event) => setState(event.target.value)}>
              <option value="">Select state</option>
              {US_STATE_OPTIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            {content.eligibilityZipLabel.includes("optional") ||
            content.eligibilityZipLabel.includes("Optional")
              ? content.eligibilityZipLabel
              : `${content.eligibilityZipLabel} (optional)`}
            <input
              className="input"
              inputMode="numeric"
              maxLength={10}
              onChange={(event) => setZip(event.target.value)}
              placeholder="Optional ZIP code"
              value={zip}
            />
          </label>
          <label className="flex items-start gap-3 text-sm font-bold">
            <input
              checked={acknowledged}
              className="mt-1"
              onChange={(event) => setAcknowledged(event.target.checked)}
              type="checkbox"
            />
            {content.eligibilityAcknowledgementText}
          </label>
        </div>
        <button className="btn btn-primary mt-5 w-full" disabled={!canComplete} onClick={submit} type="button">
          Complete pre-check and continue
        </button>
        {shownResult ? (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="font-black">{shownResult.label}</p>
            <p className="mt-1 text-sm text-slate-600">{shownResult.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              This pre-check is not final legal approval. Checkout re-checks the full shipping
              address before payment.
            </p>
            {result && result.status !== "available" ? (
              <>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  Restricted-product checkout remains unavailable for this pre-check.
                </p>
                <button className="btn btn-secondary mt-3 w-full" onClick={() => setOpen(false)} type="button">
                  Continue browsing non-restricted content
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function getEligibilityStorageKey() {
  return STORAGE_KEY;
}
