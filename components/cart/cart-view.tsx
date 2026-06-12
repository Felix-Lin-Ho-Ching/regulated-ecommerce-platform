import Link from "next/link";
import { updateCartItemAction } from "@/lib/cart/actions";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel, EmptyState } from "@/components/common/panels";
import { CheckoutSummary } from "@/components/checkout/checkout-flow";

export function CartView({ cart }: { cart: CartSnapshot }) {
  if (cart.lines.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        Add products to your cart to begin the local checkout flow. No live payment is collected.
        <Link className="btn btn-primary mt-5" href="/products">
          Shop products
        </Link>
      </EmptyState>
    );
  }

  return (
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
                  Requires age attestation, destination review, and possible document/admin review.
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
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
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
            <AlertPanel title="Restricted-product warning" tone="warning">
              Checkout includes restricted merchandise. Eligibility must be approved before the mock
              payment step appears.
            </AlertPanel>
          </div>
        ) : null}
        <Link className="btn btn-primary mt-4 w-full" href="/checkout/address">
          Continue to shipping
        </Link>
      </div>
    </div>
  );
}
