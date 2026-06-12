import { addToCartAction } from "@/lib/cart/actions";

export function AddToCartForm({
  slug,
  returnTo,
  showQuantity = false,
  checkout = false,
}: {
  slug: string;
  returnTo: string;
  showQuantity?: boolean;
  checkout?: boolean;
}) {
  return (
    <form action={addToCartAction} className="grid gap-3">
      <input name="slug" type="hidden" value={slug} />
      <input name="returnTo" type="hidden" value={checkout ? "/checkout" : returnTo} />
      {showQuantity ? (
        <label className="block max-w-32 text-sm font-bold">
          Quantity
          <select className="input mt-2" defaultValue="1" name="quantity">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>
      ) : (
        <input name="quantity" type="hidden" value="1" />
      )}
      <button className="btn btn-primary focus-ring" type="submit">
        {checkout ? "Start checkout" : "Add to cart"}
      </button>
    </form>
  );
}
