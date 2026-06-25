"use client";
import { useActionState } from "react";
import { claimBatchAction, markSelectedShippedAction, updateFulfillmentSettingsAction, type FulfillmentFormState } from "@/lib/fulfillment/admin-actions";

function Message({ state }: { state: FulfillmentFormState }) { return <>{state.error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p> : null}{state.success ? <p className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-700">{state.success}</p> : null}</>; }
export function FulfillmentSettingsForm({ settings, canEdit }: { settings: any; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateFulfillmentSettingsAction, {});
  return <form action={action} className="card grid gap-3 p-5"><h2 className="text-xl font-black">Fulfillment batch settings</h2><Message state={state}/><label className="grid gap-1 text-sm font-bold">Default batch size<input className="input" name="defaultBatchSize" type="number" min="1" defaultValue={settings.defaultBatchSize} disabled={!canEdit}/></label><label className="grid gap-1 text-sm font-bold">Maximum batch size<input className="input" name="maxBatchSize" type="number" min="1" max="200" defaultValue={settings.maxBatchSize} disabled={!canEdit}/></label><label className="flex gap-2 text-sm font-bold"><input name="allowCustomClaim" type="checkbox" defaultChecked={settings.allowCustomClaim} disabled={!canEdit}/> Allow custom claim size</label>{canEdit ? <button className="btn btn-primary" disabled={pending}>Save fulfillment settings</button> : <p className="text-sm text-slate-600">Fulfillment users can view claim options but cannot edit settings.</p>}</form>;
}
export function ClaimBatchForm({ settings }: { settings: any }) {
  const [state, action, pending] = useActionState(claimBatchAction, {});
  return <form action={action} className="card grid gap-3 p-5"><h2 className="text-xl font-black">Claim orders</h2><Message state={state}/><button className="btn btn-primary" name="claimSize" value={settings.defaultBatchSize} disabled={pending}>Claim next batch</button>{settings.allowCustomClaim ? <div className="flex flex-wrap gap-2"><button className="btn btn-secondary" name="claimSize" value="25">Claim 25</button><button className="btn btn-secondary" name="claimSize" value="50">Claim 50</button><label className="flex items-center gap-2 text-sm font-bold">Claim custom amount <input className="input w-28" name="claimSize" type="number" min="1" max={settings.maxBatchSize}/></label></div> : null}<p className="text-sm text-slate-600">Default {settings.defaultBatchSize}; maximum {settings.maxBatchSize}.</p></form>;
}
export function ShipSelectedForm({ children }: { children: React.ReactNode }) {
  const [state, action, pending] = useActionState(markSelectedShippedAction, {});
  return <form action={action} className="grid gap-3"><Message state={state}/>{children}<div className="card flex flex-wrap gap-2 p-4"><input className="input max-w-40" name="carrier" placeholder="Carrier"/><input className="input max-w-56" name="trackingNumber" placeholder="Tracking number"/><button className="btn btn-primary" disabled={pending}>Mark selected as shipped</button></div></form>;
}
