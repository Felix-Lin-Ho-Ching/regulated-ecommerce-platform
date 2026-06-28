"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { updateOrderStatusAction } from "@/lib/admin/orders/actions";
import type { AdminActionState } from "@/lib/admin/action-state";

export function OrderStatusForm({ orderId, orderNumber, currentStatus, statuses }: { orderId: string; orderNumber: string; currentStatus: string; statuses: readonly string[] }) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(updateOrderStatusAction, {});

  return (
    <form action={formAction} className="card p-5 grid gap-3">
      <h2 className="font-black">Update status</h2>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="orderNumber" value={orderNumber} />
      {state.error ? <AlertPanel title="Status update blocked" tone="danger">{state.error}</AlertPanel> : null}
      {state.success ? <AlertPanel title="Status updated" tone="success">{state.success}</AlertPanel> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Status *
        <select name="status" className="input" defaultValue={currentStatus}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Owner note <span className="font-normal text-slate-500">(optional)</span>
        <textarea name="note" className="input min-h-24" placeholder="Optional context for this status change" />
      </label>
      <button className="btn btn-primary">Save status</button>
    </form>
  );
}
