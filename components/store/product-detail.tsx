import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel } from "@/components/common/panels";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

export function ProductDetail({ product }: { product: CatalogProduct }) {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <div className="card flex min-h-96 items-center justify-center bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 p-8 text-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">
            Product image
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-700">{product.name}</h2>
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

        {product.restricted ? (
          <div className="mt-5">
            <AlertPanel title="Restricted item" tone="warning">
              Age and shipping eligibility verified at checkout.
            </AlertPanel>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <AddToCartForm returnTo={`/products/${product.slug}`} showQuantity slug={product.slug} />
          <a className="btn btn-secondary text-center" href="/cart">View cart</a>
        </div>
      </section>
    </div>
  );
}
