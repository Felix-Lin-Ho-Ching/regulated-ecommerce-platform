"use client";

import { useActionState, type ReactNode } from "react";
import { markSelectedShippedAction } from "@/lib/fulfillment/admin-actions";
import { Message } from "@/components/admin/fulfillment/message";

export function ShipSelectedForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(markSelectedShippedAction, {});

  return (
    <form action={action} className="grid gap-3">
      <Message state={state} />
      {children}
      <div className="card flex flex-wrap gap-2 p-4">
        <input className="input max-w-40" name="carrier" placeholder="Carrier" />
        <input className="input max-w-56" name="trackingNumber" placeholder="Tracking number" />
        <button className="btn btn-primary" disabled={pending}>
          Mark selected as shipped
        </button>
      </div>
    </form>
  );
}
