"use client";

import { useActionState } from "react";
import { confirmSingleShipmentAction } from "@/lib/fulfillment/admin-actions";
import { FulfillmentMessage } from "@/components/admin/fulfillment/fulfillment-message";

export function SingleShipmentForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(confirmSingleShipmentAction, {});

  return (
    <form action={action} className="mt-4 grid gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 print:hidden">
      <input type="hidden" name="orderId" value={orderId} />
      <FulfillmentMessage state={state} />
      <p className="text-sm text-slate-700">Create the label outside the app, then enter the carrier and tracking number for this order only.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">Carrier<input className="input mt-1" name="carrier" placeholder="UPS" required /></label>
        <label className="text-sm font-bold">Tracking number<input className="input mt-1" name="trackingNumber" placeholder="1Z..." required minLength={6} /></label>
      </div>
      <button className="btn btn-primary w-fit" disabled={pending}>{pending ? "Confirming…" : "Confirm shipment"}</button>
    </form>
  );
}
