"use client";

import { useActionState } from "react";
import { archiveProductAction, restoreProductAction, type ProductActionState } from "@/lib/products/actions";
import { AlertPanel } from "@/components/common/panels";

export function ArchiveProductForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<ProductActionState, FormData>(archiveProductAction, {});

  return (
    <form action={formAction} className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <input name="id" type="hidden" value={productId} />
      <h2 className="font-black text-red-950">Archive product</h2>
      <p className="mt-2 text-sm text-red-900">
        This keeps history intact and hides the product from storefront catalog queries.
      </p>
      {state.error ? <div className="mt-4"><AlertPanel title="Archive blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      <label className="mt-4 grid gap-2 text-sm font-bold text-red-950">
        Required archive reason
        <textarea className="input min-h-24" name="archiveNote" />
      </label>
      <button className="btn btn-danger mt-4" type="submit">
        Archive product
      </button>
    </form>
  );
}

export function RestoreProductForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<ProductActionState, FormData>(restoreProductAction, {});

  return (
    <form action={formAction} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <input name="id" type="hidden" value={productId} />
      <h2 className="font-black text-emerald-950">Restore product</h2>
      <p className="mt-2 text-sm text-emerald-900">Restored products return to the active admin list and may be eligible for storefront display.</p>
      {state.error ? <div className="mt-4"><AlertPanel title="Restore blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      <label className="mt-4 grid gap-2 text-sm font-bold text-emerald-950">
        Required restore reason
        <textarea className="input min-h-24" name="restoreNote" />
      </label>
      <button className="btn btn-primary mt-4" type="submit">Restore product</button>
    </form>
  );
}
