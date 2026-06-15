import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { ProductCard } from "@/components/store-products";
import { getCatalogProducts } from "@/lib/db/catalog";
import { PUBLIC_STATE_REQUIREMENTS, getPublicStateRequirementBySlug, type PublicStateRequirement } from "@/lib/eligibility/public-state-requirements";

export function generateStaticParams() {
  return PUBLIC_STATE_REQUIREMENTS.map((state) => ({ state: state.slug }));
}

const valueStyles: Record<PublicStateRequirement["legalForConsumerUsePossession"], string> = {
  YES: "border-emerald-200 bg-emerald-50 text-emerald-900",
  NO: "border-red-200 bg-red-50 text-red-900",
  "CHECK STATE GUIDANCE": "border-amber-200 bg-amber-50 text-amber-950",
};

function GuideCard({ title, children }: { title: string; children?: string }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-[.16em] text-teal-800">{title}</h3>
      <p className="mt-3 text-slate-700">{children || "Check current state and local guidance before purchase or carry."}</p>
    </article>
  );
}

function ChecklistRow({ label, value }: { label: string; value: PublicStateRequirement["legalForConsumerUsePossession"] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-black text-slate-950">{label}</span>
      <span className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-black ${valueStyles[value]}`}>{value}</span>
    </div>
  );
}

export default async function MyStateDetailPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const requirement = getPublicStateRequirementBySlug(state);
  if (!requirement) notFound();

  const products = (await getCatalogProducts()).slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="mx-auto max-w-4xl text-center">
          <Link className="text-sm font-black text-teal-800 underline" href="/my-state">← Back to My State</Link>
          <p className="mt-6 text-sm font-black uppercase tracking-[.24em] text-teal-800">State requirements</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Stun Fry {requirement.stateName} State Requirements</h1>
          <h2 className="mt-6 text-2xl font-black text-slate-900">Carry in {requirement.stateName}</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">{requirement.publicSummary}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <GuideCard title="Minimum age">{requirement.minimumAge}</GuideCard>
          <GuideCard title="Background check">{requirement.backgroundCheck}</GuideCard>
          <GuideCard title="Permit required for purchase">{requirement.permitRequiredForPurchase}</GuideCard>
          <GuideCard title="Carry/travel notes">{requirement.carryTravelNotes}</GuideCard>
          <GuideCard title="Restricted persons">{requirement.restrictedPersons}</GuideCard>
          <GuideCard title="Prohibited places">{requirement.prohibitedPlaces}</GuideCard>
        </section>

        <section className="card p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-slate-500">Public checklist</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{requirement.stateName} shopping guide</h2>
              {requirement.officialLawUrl ? <a className="mt-4 inline-flex font-black text-teal-800 underline" href={requirement.officialLawUrl}>State/local law source</a> : <p className="mt-4 text-sm text-slate-600">State/local law source: check current official state and local resources.</p>}
            </div>
            <div className="space-y-3">
              <ChecklistRow label="Legal for Consumer Use/Possession" value={requirement.legalForConsumerUsePossession} />
              <ChecklistRow label="Other Restrictions" value={requirement.otherRestrictions} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-xl font-black">Important note</h2>
          <p className="mt-2 leading-7">This page is informational only and is not legal advice. You are responsible for understanding and following all state and local requirements that apply to your purchase, possession, carry, storage, transport, and use. Final purchase eligibility is checked during checkout using your shipping destination.</p>
        </section>

        <section className="space-y-5">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[.2em] text-teal-800">Suggested products</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Compare Stun Fry safety products</h2>
          </div>
          <ProductCard.Grid products={products} />
        </section>
      </div>
    </AppShell>
  );
}
