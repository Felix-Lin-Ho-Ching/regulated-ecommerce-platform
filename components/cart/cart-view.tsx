import Link from "next/link";
import { updateCartItemAction } from "@/lib/cart/actions";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel, EmptyState } from "@/components/common/panels";
import { CheckoutSummary } from "@/components/checkout/checkout-flow";

export function CartView({ cart, messages }: { cart: CartSnapshot; messages?: { cartError?: string; cartNotice?: string; available?: string } }) {
  const messagePanel = getCartMessagePanel(messages);
  if (cart.lines.length === 0) {
    return (
      <>
        {messagePanel}
        <EmptyState title="Your cart is empty">
        Add products to your cart to begin checkout review.
        <Link className="btn btn-primary mt-5" href="/products">
          Shop products
        </Link>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {messagePanel}
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section className="card divide-y divide-stone-200 p-5">
        {cart.lines.map((line) => (
          <article
            className="grid gap-4 py-5 first:pt-0 md:grid-cols-[96px_1fr_auto]"
            key={line.product.slug}
          >
            <div className="h-24 rounded-2xl bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100" />
            <div>
              <div className="flex flex-wrap gap-2">
                {line.product.restricted ? <RestrictedProductBadge /> : null}
                <StatusBadge tone={line.product.stock > 0 ? "success" : "danger"}>
                  {line.product.stock > 0 ? "In stock" : "Out of stock"}
                </StatusBadge>
              </div>
              <h2 className="mt-2 font-black">{line.product.name}</h2>
              <p className="text-sm text-slate-600">
                {line.product.brand} · SKU {line.product.sku}
              </p>
              {line.product.restricted ? (
                <p className="mt-2 text-sm font-bold text-amber-900">
                  Restricted items are verified during checkout.
                </p>
              ) : null}
            </div>
            <div className="text-left md:text-right">
              <p className="font-black">{money(line.lineTotal)}</p>
              <p className="text-sm text-slate-600">{money(line.product.price)} each</p>
              <form
                action={updateCartItemAction}
                className="mt-3 flex items-center gap-2 md:justify-end"
              >
                <input name="slug" type="hidden" value={line.product.slug} />
                <select className="input w-24" defaultValue={line.quantity} name="quantity">
                  <option value="0">Remove</option>
                  {Array.from({ length: Math.min(10, line.product.stock) }, (_, index) => index + 1).map((quantity) => (
                    <option key={quantity} value={quantity}>{quantity}</option>
                  ))}
                </select>
                <button className="btn btn-secondary" type="submit">
                  Update
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
      <div>
        <CheckoutSummary cart={cart} />
        {cart.hasRestrictedItems ? (
          <div className="mt-4">
            <AlertPanel title="Restricted items" tone="warning">
              Restricted items are verified during checkout.
            </AlertPanel>
          </div>
        ) : null}
        <Link className="btn btn-primary mt-4 w-full" href="/checkout">
          Checkout
        </Link>
      </div>
      </div>
    </>
  );
}

function getCartMessagePanel(messages?: { cartError?: string; cartNotice?: string; available?: string }) {
  if (messages?.cartNotice === "adjusted") {
    return (
      <div className="mb-5">
        <AlertPanel title="Quantity adjusted" tone="warning">
          Quantity adjusted to available stock{messages.available ? ` (${messages.available}).` : "."}
        </AlertPanel>
      </div>
    );
  }

  if (!messages?.cartError) return null;

  const text = messages.cartError === "out-of-stock"
    ? "Item is out of stock."
    : messages.cartError === "not-found"
      ? "Item could not be found."
      : "Cart could not be updated.";

  return (
    <div className="mb-5">
      <AlertPanel title="Cart update needed" tone="warning">{text}</AlertPanel>
    </div>
  );
}
