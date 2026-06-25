"use client";

import { useActionState } from "react";
import { FulfillmentMessage } from "@/components/admin/fulfillment/fulfillment-message";
import {
  updateFulfillmentSettingsAction,
  type FulfillmentSettingsForAdmin,
} from "@/lib/fulfillment/admin-actions";

type FulfillmentSettingsFormProps = {
  settings: FulfillmentSettingsForAdmin;
  canEdit: boolean;
};

export function FulfillmentSettingsForm({
  settings,
  canEdit,
}: FulfillmentSettingsFormProps) {
  const [state, action, pending] = useActionState(updateFulfillmentSettingsAction, {});

  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="text-xl font-black">Fulfillment batch settings</h2>
      <FulfillmentMessage state={state} />

      <label className="grid gap-1 text-sm font-bold">
        Default batch size
        <input
          className="input"
          name="defaultBatchSize"
          type="number"
          min="1"
          defaultValue={settings.defaultBatchSize}
          disabled={!canEdit}
        />
      </label>

      <label className="grid gap-1 text-sm font-bold">
        Maximum batch size
        <input
          className="input"
          name="maxBatchSize"
          type="number"
          min="1"
          max="200"
          defaultValue={settings.maxBatchSize}
          disabled={!canEdit}
        />
      </label>

      <label className="flex gap-2 text-sm font-bold">
        <input
          name="allowCustomClaim"
          type="checkbox"
          defaultChecked={settings.allowCustomClaim}
          disabled={!canEdit}
        />
        Allow custom claim size
      </label>

      {canEdit ? (
        <button className="btn btn-primary" disabled={pending}>
          Save fulfillment settings
        </button>
      ) : (
        <p className="text-sm text-slate-600">
          Fulfillment users can view claim options but cannot edit settings.
        </p>
      )}
    </form>
  );
}
