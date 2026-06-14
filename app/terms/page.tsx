import { AppShell, SectionHeader } from "@/components/ui";

export default function Page() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Policy" title="Terms of use">
        Store terms for browsing, cart use, restricted-product eligibility, and order review.
      </SectionHeader>
      <section className="card p-6 space-y-4 text-sm leading-6 text-slate-700">
        <h2 className="text-xl font-black text-slate-950">Shopping responsibilities</h2>
        <p>Customers are responsible for providing accurate contact, age attestation, and shipping information during checkout.</p>
        <h2 className="text-xl font-black text-slate-950">Restricted products</h2>
        <p>Restricted items may be unavailable for some destinations or may require additional verification before payment.</p>
        <h2 className="text-xl font-black text-slate-950">Order review</h2>
        <p>Orders may be held, declined, or cancelled when eligibility, destination, inventory, or policy requirements are not satisfied.</p>
      </section>
    </AppShell>
  );
}
