"use client";

import { useMemo, useState, useActionState } from "react";
import { confirmSingleShipmentAction } from "@/lib/fulfillment/admin-actions";
import { FulfillmentMessage } from "@/components/admin/fulfillment/fulfillment-message";
import { renderTrackingUrl, type ShippingCarrierOption } from "@/lib/shipping/tracking";

export function SingleShipmentForm({ orderId, carriers }: { orderId: string; carriers: ShippingCarrierOption[] }) {
  const [state, action, pending] = useActionState(confirmSingleShipmentAction, {});
  const [carrierCode, setCarrierCode] = useState(carriers[0]?.code || "");
  const [trackingNumber, setTrackingNumber] = useState("");
  const selected = carriers.find((carrier) => carrier.code === carrierCode);
  const preview = useMemo(() => selected && trackingNumber.trim() ? renderTrackingUrl(selected.trackingUrlTemplate, trackingNumber) : null, [selected, trackingNumber]);

  return (
    <form action={action} className="mt-4 grid gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 print:hidden">
      <input type="hidden" name="orderId" value={orderId} />
      <FulfillmentMessage state={state} />
      <p className="text-sm text-slate-700">Create the label outside the app, then select an enabled carrier and enter the tracking number for this order only.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">Carrier<select className="input mt-1" name="carrier" required value={carrierCode} onChange={(e) => setCarrierCode(e.target.value)}><option value="">Select carrier</option>{carriers.map((carrier) => <option key={carrier.id} value={carrier.code}>{carrier.name}</option>)}</select></label>
        <label className="text-sm font-bold">Tracking number<input className="input mt-1" name="trackingNumber" placeholder="1Z..." required minLength={6} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></label>
      </div>
      {preview ? <p className="rounded-xl bg-white p-3 text-xs text-slate-700">Tracking URL preview: <span className="break-all font-bold">{preview}</span></p> : null}
      <button className="btn btn-primary w-fit" disabled={pending || !carrierCode}>{pending ? "Confirming…" : "Confirm shipment"}</button>
    </form>
  );
}
