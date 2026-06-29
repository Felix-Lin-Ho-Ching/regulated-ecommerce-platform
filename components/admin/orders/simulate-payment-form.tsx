"use client";
import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { simulatePaymentApprovedAction } from "@/lib/admin/orders/actions";
import type { AdminActionState } from "@/lib/admin/action-state";

export function SimulatePaymentForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<AdminActionState, FormData>(simulatePaymentApprovedAction, {});
  return <form action={action} className="card mt-4 grid gap-3 p-5">
    <h2 className="font-black">Development payment tools</h2>
    <p className="text-sm text-slate-600">Simulate an approved Authorize.net auth/capture for an existing unpaid order-request order and release it to fulfillment.</p>
    <input type="hidden" name="orderId" value={orderId} />
    {state.error ? <AlertPanel title="Payment simulation blocked" tone="danger">{state.error}</AlertPanel> : null}
    {state.success ? <AlertPanel title="Payment simulated" tone="success">{state.success}</AlertPanel> : null}
    <button className="btn btn-primary">Simulate payment approved</button>
  </form>;
}
