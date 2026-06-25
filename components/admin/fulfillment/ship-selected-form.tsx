"use client";

import { useActionState, type ReactNode } from "react";
import { FulfillmentMessage } from "@/components/admin/fulfillment/fulfillment-message";
import { markSelectedShippedAction } from "@/lib/fulfillment/admin-actions";

type ShipSelectedFormProps = {
  children: ReactNode;
};

export function ShipSelectedForm({ children }: ShipSelectedFormProps) {
  const [state, action, pending] = useActionState(markSelectedShippedAction, {});

  return (
    <form action={action} className="grid gap-3">
      <FulfillmentMessage state={state} />
      {children}
      <div className="card flex flex-wrap gap-2 p-4">
        <input className="input max-w-40" name="carrier" placeholder="Carrier" />
        <input
          className="input max-w-56"
          name="trackingNumber"
          placeholder="Tracking number"
        />
        <button className="btn btn-primary" disabled={pending}>
          Mark selected as shipped
        </button>
      </div>
    </form>
  );
}
