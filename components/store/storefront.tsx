import Link from "next/link";
import { brand } from "@/lib/config/brand";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AlertPanel } from "@/components/common/panels";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

const complianceSteps = [
  {
    title: "Eligibility checked before payment",
    copy: "Restricted-product eligibility is reviewed before payment is available.",
  },
  {
    title: "Destination review",
    copy: "Shipping destination rules are checked against the items in your cart.",
  },
  {
    title: "Age/ID verification when required",
    copy: "Some products may require age attestation or ID verification before checkout continues.",
  },
  {
    title: "Document/admin review when required",
    copy: "If a rule requires documents or manual approval, payment stays unavailable until review is complete.",
  },
];

export function StorefrontHome({ products }: { products: CatalogProduct[] }) {
  const featuredProducts = products.slice(0, 3);
  const heroProduct = featuredProducts[0];
  const categories = Array.from(new Set(products.map((product) => product.category))).slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-amber-50 p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_460px] md:p-8 lg:p-10">
        <div className="flex flex-col justify-center py-4">
          <p className="text-sm font-black uppercase tracking-[.22em] text-teal-900">
            {brand.name} safety essentials
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            Shop Stun Fry personal safety gear built for everyday confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Browse self-defense devices, alarms, visibility gear, and training essentials in a
            product-first storefront with clear restricted-product guidance before checkout.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/products">
              Shop products
            </Link>
            <Link className="btn btn-secondary" href="/restricted-products-policy">
              Restricted-product policy
            </Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">In-stock picks</div>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">Clear product labels</div>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">Responsible checkout</div>
          </div>
        </div>

        {heroProduct ? (
          <article className="relative rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl">
            <div className="absolute right-6 top-6 z-10 rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-slate-950">
              Featured
            </div>
            <div className="flex min-h-[22rem] items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 p-6 text-slate-950">
              <div className="relative flex h-64 w-full max-w-sm items-center justify-center rounded-[2rem] bg-white/75 shadow-inner">
                <div className="absolute inset-x-10 bottom-8 h-10 rounded-full bg-slate-900/10 blur-xl" />
                <div className="relative h-44 w-32 rotate-6 rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800 shadow-2xl" />
                <div className="relative -ml-10 h-36 w-24 -rotate-12 rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-amber-300 via-amber-200 to-white shadow-xl" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {heroProduct.restricted ? <RestrictedProductBadge /> : null}
              <StatusBadge tone={heroProduct.stock > 0 ? "success" : "danger"}>
                {heroProduct.stock > 0 ? "In stock" : "Out of stock"}
              </StatusBadge>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-stone-300">{heroProduct.brand}</p>
                <h2 className="mt-1 text-2xl font-black">{heroProduct.name}</h2>
                <strong className="mt-2 block text-3xl">{money(heroProduct.price)}</strong>
              </div>
              <Link className="btn bg-white text-slate-950" href={`/products/${heroProduct.slug}`}>
                View details
              </Link>
            </div>
          </article>
        ) : (
          <div className="rounded-[1.75rem] bg-gradient-to-br from-amber-100 via-stone-100 to-teal-100 p-5 shadow-2xl">
            <div className="flex min-h-[22rem] items-center justify-center rounded-[1.35rem] bg-white/70 text-center">
              <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">
                Product photo placeholder
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">
            Responsible shopping safeguards
          </p>
          <h2 className="mt-2 text-3xl font-black">Compliance stays clear after you start shopping.</h2>
          <p className="mt-3 text-slate-600">
            Stun Fry keeps restricted-product warnings visible without turning the storefront into a
            workflow demo. These checks happen before payment for items that require them.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {complianceSteps.map((step, index) => (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5" key={step.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-950 text-sm font-black text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.copy}</p>
            </div>
          ))}
        </div>
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
