import Link from "next/link";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/primitives";
import { money } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/db/catalog";

function ProductImagePlaceholder({ restricted }: { restricted?: boolean }) {
  return (
    <div className="relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 via-stone-100 to-slate-200">
      <div className="absolute inset-x-8 top-10 h-20 rounded-full bg-white/60 blur-2xl" />
      <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.18em] text-slate-500">
          {restricted ? "Eligibility item" : "Everyday safety"}
        </p>
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const available = Math.max(0, product.stock - product.reserved);

  return (
    <article className="card flex h-full flex-col p-4">
      <ProductImagePlaceholder restricted={product.restricted} />
      <div className="mt-4 flex flex-wrap gap-2">
        {product.restricted ? <RestrictedProductBadge /> : null}
        <StatusBadge tone={available > 20 ? "success" : "warning"}>
          {available > 0 ? `${available} available` : "Out of stock"}
        </StatusBadge>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-slate-500">
        {product.brand}
      </p>
      <h2 className="mt-1 text-lg font-black">{product.name}</h2>
      <p className="mt-2 flex-1 text-sm text-slate-600">{product.description}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <strong className="text-xl">{money(product.price)}</strong>
        <div className="flex gap-2">
          <Link className="btn btn-secondary" href="/cart">
            Add
          </Link>
          <Link className="btn btn-primary" href={`/products/${product.slug}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <section className="grid gap-5 md:col-span-3 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </section>
  );
}

export function ProductDetail({ product }: { product: CatalogProduct }) {
  const available = Math.max(0, product.stock - product.reserved);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <ProductImagePlaceholder restricted={product.restricted} />
      <section>
        <div className="flex flex-wrap gap-2">
          {product.restricted ? <RestrictedProductBadge /> : null}
          <StatusBadge tone="info">SKU {product.sku}</StatusBadge>
          <StatusBadge tone="neutral">{product.brand}</StatusBadge>
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
          {product.name}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{product.description}</p>
        <p className="mt-6 text-4xl font-black">{money(product.price)}</p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[120px_1fr]">
          <label className="text-sm font-black">
            Quantity
            <select className="input mt-2" defaultValue="1">
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
          </label>
          <div>
            <p className="text-sm font-black">Stock status</p>
            <p className="mt-2 text-sm text-slate-600">
              {available > 0 ? `${available} available for review-backed checkout.` : "Currently out of stock."}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-black">Product features</h2>
          <ul className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {(product.features.length > 0
              ? product.features
              : [
                  { code: "portable", label: "Portable", value: "Designed for everyday carry", restrictedRelevant: false },
                  { code: "support", label: "Support", value: "Clear policy and checkout guidance", restrictedRelevant: false },
                ]
            ).map((feature) => (
              <li className="rounded-xl bg-stone-50 p-3" key={feature.code}>
                <strong>{feature.label}</strong>
                <span className="mt-1 block text-slate-600">{feature.value}</span>
              </li>
            ))}
          </ul>
        </section>

        {product.restricted ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black">Restricted-product notice</h2>
            <p className="mt-2 text-sm text-slate-700">
              Eligibility depends on destination law, verified address, buyer attestations, and possible
              document or manual review. Payment is unavailable until eligibility is approved. Missing or
              unverified rules default to manual review.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/cart">
            Add to cart
          </Link>
          <Link className="btn btn-secondary" href="/checkout">
            Start checkout
          </Link>
        </div>
      </section>
    </div>
  );
}
