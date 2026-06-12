import { adjustInventoryAction } from "@/lib/inventory/actions";
import type { InventoryAdminRow } from "@/lib/inventory/service";

export function InventoryAdjustmentForm({ rows }: { rows: InventoryAdminRow[] }) {
  return (
    <form action={adjustInventoryAction} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="font-black">Stock adjustment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every inventory change creates an inventory transaction and requires a written reason.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        SKU
        <select className="input" name="inventoryId">
          {rows.map((row) => (
            <option key={row.inventoryId} value={row.inventoryId}>
              {row.sku} — {row.productName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        New on-hand stock count
        <input className="input" min="0" name="onHand" type="number" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required adjustment reason
        <textarea className="input min-h-24" name="reason" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">
        Record stock adjustment
      </button>
    </form>
  );
}
