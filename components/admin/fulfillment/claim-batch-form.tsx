"use client";

import { useActionState } from "react";
import { FulfillmentMessage } from "@/components/admin/fulfillment/fulfillment-message";
import {
  claimBatchAction,
  type FulfillmentSettingsForAdmin,
} from "@/lib/fulfillment/admin-actions";

type ClaimBatchFormProps = {
  settings: FulfillmentSettingsForAdmin;
};

export function ClaimBatchForm({ settings }: ClaimBatchFormProps) {
  const [state, action, pending] = useActionState(claimBatchAction, {});

  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="text-xl font-black">Claim orders</h2>
      <FulfillmentMessage state={state} />

      <button
        className="btn btn-primary"
        name="claimSize"
        value={settings.defaultBatchSize}
        disabled={pending}
      >
        Claim next batch
      </button>

      {settings.allowCustomClaim ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" name="claimSize" value="25">
            Claim 25
          </button>
          <button className="btn btn-secondary" name="claimSize" value="50">
            Claim 50
          </button>
          <label className="flex items-center gap-2 text-sm font-bold">
            Claim custom amount
            <input
              className="input w-28"
              name="claimSize"
              type="number"
              min="1"
              max={settings.maxBatchSize}
            />
          </label>
        </div>
      ) : null}

      <p className="text-sm text-slate-600">
        Default {settings.defaultBatchSize}; maximum {settings.maxBatchSize}.
      </p>
    </form>
  );
}
