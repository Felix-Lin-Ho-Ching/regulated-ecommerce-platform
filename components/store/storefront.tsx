import Link from "next/link";
import { brand } from "@/lib/config/brand";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel } from "@/components/common/panels";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

export function StorefrontHome({ products }: { products: CatalogProduct[] }) {
  const featuredProducts = products.slice(0, 3);
  const heroProduct = featuredProducts[0];
  const categories = Array.from(new Set(products.map((product) => product.category))).slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_420px] md:p-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[.22em] text-teal-900">
            {brand.tagline}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Everyday safety gear, ready for responsible checkout.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Shop Stun Fry for personal safety alarms, visibility gear, training essentials, and
            clearly labeled restricted products.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/products">
              Shop products
            </Link>
            <Link className="btn btn-secondary" href="/cart">
              View cart
            </Link>
          </div>
        </div>
        {heroProduct ? (
          <article className="rounded-3xl bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 p-5">
            <div className="flex h-56 items-center justify-center rounded-2xl bg-white/70 text-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-teal-900">
                  Featured product
                </p>
                <h2 className="mt-2 text-2xl font-black">{heroProduct.name}</h2>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {heroProduct.restricted ? <RestrictedProductBadge /> : null}
              <StatusBadge tone={heroProduct.stock > 0 ? "success" : "danger"}>
                {heroProduct.stock > 0 ? "In stock" : "Out of stock"}
              </StatusBadge>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-600">{heroProduct.brand}</p>
                <strong className="text-2xl">{money(heroProduct.price)}</strong>
              </div>
              <Link className="btn btn-primary" href={`/products/${heroProduct.slug}`}>
                View details
              </Link>
            </div>
          </article>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Link className="card p-5" href={`/products?category=${category}`} key={category}>
            <p className="text-xs font-black uppercase tracking-[.2em] text-teal-900">Category</p>
            <h2 className="mt-2 text-xl font-black capitalize">{category.replaceAll("_", " ")}</h2>
            <p className="mt-2 text-sm text-slate-600">Browse product-first collections.</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">
              Featured products
            </p>
            <h2 className="text-3xl font-black">Shop Stun Fry picks</h2>
          </div>
          <Link className="btn btn-secondary" href="/products">
            View all products
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <article className="card flex flex-col p-5" key={product.id}>
              <div className="mb-4 h-36 rounded-2xl bg-gradient-to-br from-stone-100 to-teal-100" />
              <div className="flex flex-wrap gap-2">
                {product.restricted ? <RestrictedProductBadge /> : null}
                <StatusBadge tone={product.stock > 0 ? "success" : "danger"}>
                  {product.stock > 0 ? "In stock" : "Out of stock"}
                </StatusBadge>
              </div>
              <h3 className="mt-3 font-black">{product.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{product.brand}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <strong>{money(product.price)}</strong>
                <Link className="btn btn-secondary" href={`/products/${product.slug}`}>
                  View
                </Link>
              </div>
              <div className="mt-3">
                <AddToCartForm returnTo="/cart" slug={product.slug} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <AlertPanel title="Responsible restricted-product checkout" tone="warning">
        Restricted-product warnings stay visible during shopping. Eligibility, document review, and
        admin review remain local MVP checkpoints; live payment remains disabled.
      </AlertPanel>
    </div>
  );
}
