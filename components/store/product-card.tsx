import Link from "next/link";
import { money } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/db/catalog";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 text-center text-sm font-black text-slate-500">
      {name}
    </div>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const stockTone = product.stock > 20 ? "success" : product.stock > 0 ? "warning" : "danger";
  const stockText = product.stock > 0 ? `${product.stock} in stock` : "Out of stock";

  return (
    <article className="card flex flex-col p-5">
      <ProductImagePlaceholder name={product.name} />
      <div className="flex flex-wrap gap-2">
        {product.restricted ? <RestrictedProductBadge /> : null}
        <StatusBadge tone={stockTone}>{stockText}</StatusBadge>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-teal-900">
        {product.brand}
      </p>
      <h2 className="mt-1 text-lg font-black">{product.name}</h2>
      <p className="mt-2 flex-1 text-sm text-slate-600">{product.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <strong className="text-xl">{money(product.price)}</strong>
        <span className="text-xs font-bold text-slate-500">SKU {product.sku}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link className="btn btn-secondary" href={`/products/${product.slug}`}>
          View
        </Link>
        <AddToCartForm returnTo="/cart" slug={product.slug} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <section className="grid gap-4 md:col-span-3 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </section>
  );
}
