import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

export function ProductDetail({ product }: { product: CatalogProduct }) {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <div className="card overflow-hidden p-5">
        <div className="relative min-h-96 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-teal-950 to-amber-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,.24),transparent_28%),radial-gradient(circle_at_78%_26%,rgba(251,191,36,.32),transparent_24%)]" />
          <div className="absolute bottom-12 left-1/2 h-10 w-56 -translate-x-1/2 rounded-full bg-black/30 blur-xl" />
          <div className="absolute bottom-20 left-1/2 h-48 w-32 -translate-x-1/2 rotate-6 rounded-[2rem] border border-white/25 bg-gradient-to-br from-stone-100 to-slate-500 shadow-2xl" />
          <div className="absolute bottom-24 left-[58%] h-32 w-20 -rotate-12 rounded-[1.5rem] border border-white/25 bg-gradient-to-br from-amber-200 to-white shadow-xl" />
          <span className="sr-only">Stun Fry styled product visual for {product.name}</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((thumb) => (
            <div className="h-20 rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-100 to-teal-100" key={thumb} />
          ))}
        </div>
      </div>
      <section>
        <div className="flex flex-wrap gap-2">
          {product.restricted ? <RestrictedProductBadge /> : null}
          <StatusBadge tone="info">SKU {product.sku}</StatusBadge>
          <StatusBadge tone="neutral">{product.brand}</StatusBadge>
          <StatusBadge tone={product.stock > 0 ? "success" : "danger"}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </StatusBadge>
        </div>
        <h1 className="mt-4 text-4xl font-black">{product.name}</h1>
        <p className="mt-3 text-slate-600">{product.description}</p>
        <p className="mt-5 text-3xl font-black">{money(product.price)}</p>



        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-black">Product features</h2>
          {product.features.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {product.features.map((feature) => (
                <li key={feature.code}>
                  <strong>{feature.label}:</strong> {feature.value}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Inventory-backed catalog item with shopper-facing stock status.</li>
              <li>Product details available before checkout.</li>
              <li>Shipping restrictions may apply for restricted items.</li>
            </ul>
          )}
        </section>


        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <AddToCartForm returnTo={`/products/${product.slug}`} showQuantity slug={product.slug} />
          <a className="btn btn-secondary text-center" href="/cart">View cart</a>
        </div>
      </section>
    </div>
  );
}
