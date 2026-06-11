import Link from "next/link";
import { AlertPanel, RestrictedProductBadge, StatusBadge } from "@/components/common/primitives";
import { brand } from "@/lib/config/brand";

export function StoreHero() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">Fast shop flow</StatusBadge>
            <RestrictedProductBadge />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
            Safety products from {brand.name}, with eligibility checked before payment.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Shop personal safety gear, review clear restricted-product notices, and move through a simple
            cart-to-confirmation checkout experience.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
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
        <div className="rounded-[1.5rem] bg-gradient-to-br from-orange-100 via-stone-100 to-slate-200 p-6">
          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Featured item</p>
            <h2 className="mt-3 text-2xl font-black">ArcGuard Restricted Knuckle Stun Device</h2>
            <p className="mt-2 text-sm text-slate-600">
              A restricted Stun Fry product with visible notices and eligibility review before payment.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone="warning">Manual review defaults</StatusBadge>
              <StatusBadge tone="info">Mock payment only</StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryCards() {
  const categories = [
    { title: "Personal alarms", copy: "Portable tools for everyday readiness.", href: "/products" },
    { title: "Training kits", copy: "Practice planning and safety scenarios.", href: "/products" },
    { title: "Restricted devices", copy: "Eligibility notices before checkout or payment.", href: "/products" },
  ];

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {categories.map((category) => (
        <Link className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg" href={category.href} key={category.title}>
          <h2 className="text-xl font-black">{category.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{category.copy}</p>
          <span className="mt-4 inline-flex text-sm font-black text-teal-900">Shop category →</span>
        </Link>
      ))}
    </section>
  );
}

export function TrustComplianceBand() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <AlertPanel title="Payment waits" tone="success">
        Checkout keeps payment unavailable until eligibility checks are complete.
      </AlertPanel>
      <AlertPanel title="Restricted notices" tone="warning">
        Restricted products show policy and review requirements before cart and checkout.
      </AlertPanel>
      <AlertPanel title="Mock-only Phase 2A" tone="info">
        Verification and payment remain mocked while the storefront experience is improved.
      </AlertPanel>
    </div>
  );
}
