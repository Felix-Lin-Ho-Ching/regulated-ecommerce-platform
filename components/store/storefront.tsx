import Link from "next/link";
import { brand } from "@/lib/config/brand";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel } from "@/components/common/panels";

export function StorefrontHome({ products }: { products: CatalogProduct[] }) {
  const featuredProducts = products.slice(0, 3);
  const categories = Array.from(new Set(products.map((product) => product.category))).slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[1.15fr_.85fr] md:p-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-teal-900">
            {brand.tagline}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Shop responsible self-defense essentials.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            {brand.name} pairs practical safety products with clear restricted-product notices,
            eligibility checks, and payment controls that happen before fulfillment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/products">
              Shop products
            </Link>
            <Link className="btn btn-secondary" href="/restricted-products-policy">
              View restricted-product policy
            </Link>
            <Link className="btn btn-secondary" href="/checkout">
              Start checkout
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 p-6">
          <StatusBadge tone="warning">Eligibility checked before payment</StatusBadge>
          <h2 className="mt-6 text-2xl font-black">Featured restricted-product flow</h2>
          <p className="mt-2 text-sm text-slate-600">
            Shoppers see restrictions before checkout, complete shipping and eligibility steps, and
            only reach mock payment after approval.
          </p>
          <div className="mt-6 grid gap-3 text-sm font-bold">
            <span className="rounded-xl bg-white/80 p-3">Age attestation</span>
            <span className="rounded-xl bg-white/80 p-3">Destination review</span>
            <span className="rounded-xl bg-white/80 p-3">Document or admin review when required</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Link className="card p-5" href={`/products?category=${category}`} key={category}>
            <p className="text-xs font-black uppercase tracking-[.2em] text-teal-900">Category</p>
            <h2 className="mt-2 text-xl font-black">{category.replaceAll("_", " ")}</h2>
            <p className="mt-2 text-sm text-slate-600">Shop inventory-backed products.</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">
              Popular picks
            </p>
            <h2 className="text-3xl font-black">Ready to shop</h2>
          </div>
          <Link className="btn btn-secondary" href="/products">
            View all products
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <article className="card p-5" key={product.id}>
              <div className="mb-4 h-28 rounded-2xl bg-gradient-to-br from-stone-100 to-teal-100" />
              <div className="flex flex-wrap gap-2">
                {product.restricted ? <RestrictedProductBadge /> : null}
                <StatusBadge tone={product.stock > 0 ? "success" : "danger"}>
                  {product.stock > 0 ? "In stock" : "Out of stock"}
                </StatusBadge>
              </div>
              <h3 className="mt-3 font-black">{product.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{product.brand}</p>
              <div className="mt-4 flex items-center justify-between">
                <strong>{money(product.price)}</strong>
                <Link className="btn btn-primary" href={`/products/${product.slug}`}>
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AlertPanel title="Restricted-product safeguards" tone="warning">
        Restricted products keep visible warnings throughout shopping. Eligibility, document review,
        and admin review are mocked in this phase; live payment remains disabled until approval.
      </AlertPanel>
    </div>
  );
}
