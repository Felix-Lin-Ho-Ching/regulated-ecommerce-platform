import { addToCartAction } from "@/lib/cart/actions";

export function AddToCartForm({
  slug,
  returnTo,
  showQuantity = false,
  checkout = false,
  availableStock = 10,
}: {
  slug: string;
  returnTo: string;
  showQuantity?: boolean;
  checkout?: boolean;
  availableStock?: number;
}) {
  const maxSelectable = Math.min(10, Math.max(0, Math.floor(availableStock)));
  const outOfStock = maxSelectable <= 0;

  return (
    <form action={addToCartAction} className="grid gap-3">
      <input name="slug" type="hidden" value={slug} />
      <input name="returnTo" type="hidden" value={checkout ? "/checkout" : returnTo} />
      {showQuantity && !outOfStock ? (
        <label className="block max-w-32 text-sm font-bold">
          Quantity
          <select className="input mt-2" defaultValue="1" name="quantity">
            {Array.from({ length: maxSelectable }, (_, index) => index + 1).map((quantity) => (
              <option key={quantity} value={quantity}>{quantity}</option>
            ))}
          </select>
        </label>
      ) : (
        <input name="quantity" type="hidden" value="1" />
      )}
      <button className="btn btn-primary focus-ring" disabled={outOfStock} type="submit">
        {outOfStock ? "Out of stock" : checkout ? "Start checkout" : "Add to cart"}
      </button>
    </form>
  );
}
