"use client";
import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { confirmShipmentAction, type FulfillmentActionState } from "@/lib/fulfillment/actions";

export function FulfillmentShipForm({ token }: { token: string }) {
  const [state, action] = useActionState<FulfillmentActionState, FormData>(confirmShipmentAction, {});
  return <form action={action} className="card mt-5 grid gap-3 p-5"><input type="hidden" name="token" value={token} />{state.error ? <AlertPanel title="Shipment blocked" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title={state.alreadyShipped ? "Already shipped" : "Shipment confirmed"} tone="success">{state.success}</AlertPanel> : null}<label className="text-sm font-bold">Carrier <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="carrier" /></label><label className="text-sm font-bold">Tracking number <span className="font-normal text-slate-500">optional</span><input className="input mt-1" name="trackingNumber" /></label><button className="btn btn-primary">Confirm shipped</button></form>;
}
