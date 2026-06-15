import Link from "next/link";
import type { CatalogProduct } from "@/lib/db/catalog";
import type { StorefrontContent } from "@/lib/storefront-content/defaults";
import { money } from "@/lib/utils";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

function ProductVisual({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-teal-950 to-amber-200 ${large ? "min-h-80" : "h-48"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.22),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,.3),transparent_24%)]" />
      <div className="absolute bottom-8 left-1/2 h-8 w-48 -translate-x-1/2 rounded-full bg-black/30 blur-xl" />
      <div className="absolute bottom-12 left-1/2 h-36 w-24 -translate-x-1/2 rotate-6 rounded-[1.5rem] border border-white/25 bg-gradient-to-br from-stone-100 to-slate-400 shadow-2xl" />
      <div className="absolute bottom-16 left-[58%] h-24 w-16 -rotate-12 rounded-2xl border border-white/25 bg-gradient-to-br from-amber-200 to-white shadow-xl" />
      <span className="sr-only">Stun Fry styled product visual for {name}</span>
    </div>
  );
}

export function StorefrontHome({ content, products }: { content: StorefrontContent; products: CatalogProduct[] }) {
  const featuredProducts = products.slice(0, 4);
  const heroProduct = featuredProducts[0];
  const featureBlocks = featuredProducts.slice(0, 2);

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 overflow-hidden bg-slate-950 px-4 py-20 text-white md:rounded-[2rem] lg:mx-0">
        {content.heroImageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${content.heroImageUrl})` }} />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,.35),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(251,191,36,.28),transparent_24%),linear-gradient(135deg,#020617,#123a42_55%,#1f2937)]" />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[.28em] text-amber-200">{content.heroEyebrow}</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{content.heroTitle}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-100">{content.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="btn bg-amber-300 text-slate-950" href={content.primaryCtaLink}>{content.primaryCtaLabel}</Link>
            <Link className="btn border border-white/40 bg-white/10 text-white backdrop-blur" href={content.secondaryCtaLink}>{content.secondaryCtaLabel}</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {content.trustBadgeLabels.map((badge) => (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center text-sm font-black text-slate-800 shadow-sm" key={badge}>{badge}</div>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {(featureBlocks.length ? featureBlocks : products.slice(0, 2)).map((product) => (
          <article className="card overflow-hidden p-5" key={product.id}>
            <ProductVisual large name={product.name} />
            <div className="mt-5 flex flex-wrap gap-2">
              {product.restricted ? <RestrictedProductBadge /> : null}
              <StatusBadge tone={product.stock > 0 ? "success" : "danger"}>{product.stock > 0 ? "In stock" : "Out of stock"}</StatusBadge>
            </div>
            <h2 className="mt-4 text-2xl font-black">{product.name}</h2>
            <p className="mt-2 text-slate-600">{product.description}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-2xl">{money(product.price)}</strong>
              <div className="flex gap-2">
                <Link className="btn btn-secondary" href={`/products/${product.slug}`}>Learn more</Link>
                <AddToCartForm returnTo="/" slug={product.slug} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">{content.featuredSectionEyebrow}</p>
            <h2 className="text-3xl font-black">{content.featuredSectionTitle}</h2>
          </div>
          <Link className="btn btn-secondary" href="/products">View all products</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {featuredProducts.map((product) => (
            <article className="card flex flex-col p-4" key={product.id}>
              <ProductVisual name={product.name} />
              <h3 className="mt-4 font-black">{product.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{product.brand}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <strong>{money(product.price)}</strong>
                <Link className="font-black text-teal-900" href={`/products/${product.slug}`}>Shop now</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">Check your state</p>
          <h2 className="mt-2 text-3xl font-black">{content.trustComplianceTitle}</h2>
          <p className="mt-3 text-slate-600">{content.trustComplianceBody}</p>
          <Link className="btn btn-primary mt-5" href="/restricted-products-policy">Review state policy</Link>
        </div>
        <div className="space-y-3">
          {["When is eligibility reviewed?", "How do restricted items ship?", "What support is available after purchase?"].map((question, index) => (
            <details className="rounded-2xl border border-stone-200 p-4" key={question} open={index === 0}>
              <summary className="cursor-pointer font-black">{question}</summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">Address-based eligibility is handled during checkout, with clear next steps before any order is placed.</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
