import Link from "next/link";
import { money } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/db/catalog";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div className="relative mb-4 h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-teal-950 to-amber-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.22),transparent_28%)]" />
      <div className="absolute bottom-7 left-1/2 h-7 w-32 -translate-x-1/2 rounded-full bg-black/30 blur-xl" />
      <div className="absolute bottom-10 left-1/2 h-24 w-16 -translate-x-1/2 rotate-6 rounded-2xl border border-white/25 bg-gradient-to-br from-stone-100 to-slate-400 shadow-2xl" />
      <span className="sr-only">Stun Fry styled product visual for {name}</span>
    </div>
  );
}

function ProductCardMedia({ product }: { product: CatalogProduct }) {
  const image = product.media.find((media) => media.type === "IMAGE");
  if (!image) return <ProductImagePlaceholder name={product.name} />;

  return (
    <div className="mb-4 h-44 overflow-hidden rounded-2xl bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-full w-full object-cover" src={image.url} alt={image.alt ?? product.name} />
    </div>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const stockTone = product.stock > 20 ? "success" : product.stock > 0 ? "warning" : "danger";
  const stockText = product.stock > 0 ? `${product.stock} in stock` : "Out of stock";

  return (
    <article className="card flex flex-col p-5">
      <ProductCardMedia product={product} />
      <div className="flex flex-wrap gap-2">
        {product.restricted ? <RestrictedProductBadge /> : null}
        <StatusBadge tone={stockTone}>{stockText}</StatusBadge>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-teal-900">{product.brand}</p>
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
        <AddToCartForm returnTo="/products" slug={product.slug} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </section>
  );
}
