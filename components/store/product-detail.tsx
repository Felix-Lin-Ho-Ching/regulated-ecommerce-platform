import Link from "next/link";
import { RestrictedProductBadge, StatusBadge } from "@/components/common/badge";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { ProductMediaGallery } from "@/components/store/product-media-gallery";

function section(product: CatalogProduct, key: string) { return product.contentSections.find((item) => item.sectionKey === key); }

export function ProductDetail({ product }: { product: CatalogProduct }) {
  const overview = section(product, "overview");
  const stateRequirements = section(product, "state_requirements");
  return (
    <div className="grid gap-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,.9fr)]">
        <ProductMediaGallery media={product.media} productName={product.name} />
        <aside className="h-fit rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <div className="flex flex-wrap gap-2"><StatusBadge tone={product.stock > 0 ? "success" : "danger"}>{product.stock > 0 ? "In stock" : "Out of stock"}</StatusBadge>{product.restricted ? <RestrictedProductBadge /> : null}<StatusBadge tone="neutral">{product.category}</StatusBadge></div>
          <p className="mt-5 text-sm font-black uppercase tracking-[.25em] text-teal-900">{product.brand}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{product.name}</h1>
          <p className="mt-3 text-slate-600">{overview?.body ?? product.description}</p>
          <p className="mt-5 text-4xl font-black">{money(product.price)}</p>
          <div className="mt-4 grid gap-2 rounded-2xl bg-stone-50 p-4 text-sm"><p><strong>SKU:</strong> {product.sku}</p><p><strong>Availability:</strong> Ships when inventory and destination checks are satisfied.</p>{product.restricted ? <p className="font-bold text-amber-800">Restricted item: checkout performs final destination verification using restricted class {product.restrictedClass ?? "configured for this item"}.</p> : null}</div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><AddToCartForm availableStock={product.stock} returnTo={`/products/${product.slug}`} showQuantity slug={product.slug} /><Link className="btn btn-secondary text-center" href="/cart">View cart</Link></div>
          {product.features.length ? <ul className="mt-6 grid gap-2 text-sm text-slate-700">{product.features.map((feature) => <li className="rounded-xl border border-stone-200 p-3" key={feature.code}><strong>{feature.label}:</strong> {feature.value}</li>)}</ul> : null}
        </aside>
      </div>

      {product.contentSections.filter((item) => !["overview", "state_requirements", "faq", "specs", "whats_included"].includes(item.sectionKey)).map((item) => <section className="card grid gap-3 p-6" key={`${item.sectionKey}-${item.sortOrder}`}>{item.eyebrow ? <p className="text-sm font-black uppercase tracking-[.25em] text-teal-900">{item.eyebrow}</p> : null}<h2 className="text-3xl font-black">{item.title}</h2>{item.body ? <p className="max-w-3xl text-slate-600">{item.body}</p> : null}</section>)}

      {product.includedItems.length ? <section className="card p-6"><h2 className="text-3xl font-black">What’s included</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{product.includedItems.map((item) => <div className="rounded-2xl border border-stone-200 p-4" key={`${item.label}-${item.sortOrder}`}><p className="font-black">{item.quantity} × {item.label}</p>{item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}</div>)}</div></section> : null}

      {product.specs.length ? <section className="card overflow-hidden p-6"><h2 className="text-3xl font-black">Specifications</h2><div className="mt-5 overflow-x-auto"><table className="table"><tbody>{product.specs.map((spec) => <tr key={`${spec.label}-${spec.sortOrder}`}><th className="w-1/3">{spec.group ? `${spec.group} — ${spec.label}` : spec.label}</th><td>{spec.value}</td></tr>)}</tbody></table></div></section> : null}

      {product.restricted ? <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><h2 className="text-3xl font-black">State availability and compliance</h2><p className="mt-3 text-amber-950">{stateRequirements?.body ?? "Availability depends on shipping destination. Checkout performs final destination verification and may block, request review, or allow an order based on configured rules."}</p><Link className="btn btn-secondary mt-4" href="/my-state">Check state/ZIP eligibility</Link></section> : null}

      {product.faqs.length ? <section className="card p-6"><h2 className="text-3xl font-black">FAQ</h2><div className="mt-5 grid gap-3">{product.faqs.map((faq) => <details className="rounded-2xl border border-stone-200 p-4" key={`${faq.question}-${faq.sortOrder}`}><summary className="cursor-pointer font-black">{faq.question}</summary><p className="mt-2 text-slate-600">{faq.answer}</p></details>)}</div></section> : null}
    </div>
  );
}
