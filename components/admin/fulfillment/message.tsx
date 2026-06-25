"use client";

import type { FulfillmentFormState } from "@/lib/fulfillment/admin-actions";

export function Message({ state }: { state: FulfillmentFormState }) {
  return (
    <>
      {state.error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-700">{state.success}</p>
      ) : null}
    </>
  );
}
