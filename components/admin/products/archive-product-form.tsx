import { archiveProductAction } from "@/lib/products/actions";

export function ArchiveProductForm({ productId }: { productId: string }) {
  return (
    <form action={archiveProductAction} className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <input name="id" type="hidden" value={productId} />
      <h2 className="font-black text-red-950">Archive product</h2>
      <p className="mt-2 text-sm text-red-900">
        This keeps history intact and hides the product from storefront catalog queries.
      </p>
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
