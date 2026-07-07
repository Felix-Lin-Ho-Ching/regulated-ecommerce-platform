"use client";
import { useMemo, useState, useActionState } from "react";
import { saveShippingCarrierAction, disableShippingCarrierAction } from "@/lib/shipping/admin-actions";
import { renderTrackingUrl, type ShippingCarrierOption } from "@/lib/shipping/tracking";
import { AlertPanel } from "@/components/ui";

export function ShippingCarrierForm({ carrier }: { carrier?: ShippingCarrierOption }) {
  const [state, action, pending] = useActionState(saveShippingCarrierAction, {});
  const [template, setTemplate] = useState(carrier?.trackingUrlTemplate || "https://example.com/track/{{trackingNumber}}");
  const preview = useMemo(() => template.includes("{{trackingNumber}}") ? renderTrackingUrl(template, "TEST 123") : "Template must include {{trackingNumber}}", [template]);
  return <form action={action} className="grid gap-2 rounded-xl border p-3">
    <input type="hidden" name="id" value={carrier?.id || ""} />
    {state.error ? <AlertPanel title="Carrier blocked" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title="Carrier saved" tone="success">{state.success}</AlertPanel> : null}
    <div className="grid gap-2 md:grid-cols-4"><input className="input" name="name" defaultValue={carrier?.name} placeholder="Name" required /><input className="input" name="code" defaultValue={carrier?.code} placeholder="code" required /><input className="input" name="sortOrder" type="number" defaultValue={carrier?.sortOrder ?? 0} /><label className="flex items-center gap-2 text-sm font-bold"><input name="enabled" type="checkbox" defaultChecked={carrier?.enabled ?? true} /> Enabled</label></div>
    <input className="input" name="trackingUrlTemplate" value={template} onChange={(e) => setTemplate(e.target.value)} required />
    <p className="text-xs text-slate-600">Preview: {preview}</p>
    <div className="flex gap-2"><button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : carrier ? "Save carrier" : "Create carrier"}</button></div>
  </form>;
}
export function DisableShippingCarrierForm({ id }: { id: string }) { return <form action={disableShippingCarrierAction}><input type="hidden" name="id" value={id} /><button className="btn btn-secondary text-xs">Disable</button></form>; }
