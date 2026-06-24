"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { adjustInventoryAction } from "@/lib/inventory/actions";
import type { AdminActionState } from "@/lib/admin/action-state";
import type { InventoryAdminRow } from "@/lib/inventory/service";

export function InventoryAdjustmentForm({ rows }: { rows: InventoryAdminRow[] }) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(adjustInventoryAction, {});

  return (
    <form action={formAction} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="font-black">Stock adjustment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every inventory change creates an inventory transaction and audit log. Adjustment reason is optional for routine owner stock counts.
        </p>
      </div>
      {state.error ? <div className="md:col-span-2"><AlertPanel title="Inventory adjustment blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      {state.success ? <div className="md:col-span-2"><AlertPanel title="Inventory adjusted" tone="success">{state.success}</AlertPanel></div> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        SKU *
        <select className="input" name="inventoryId">
          {rows.map((row) => (
            <option key={row.inventoryId} value={row.inventoryId}>{row.sku} — {row.productName}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        New on-hand stock count *
        <input className="input" min="0" name="onHand" type="number" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Adjustment reason <span className="font-normal text-slate-500">(optional)</span>
        <textarea className="input min-h-24" name="reason" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">Record stock adjustment</button>
    </form>
  );
}
