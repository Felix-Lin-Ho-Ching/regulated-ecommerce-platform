import { AppShell, SectionHeader } from "@/components/ui";

export default function Page() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Policy" title="Returns policy">
        Return eligibility depends on item condition, order status, and restricted-product handling rules.
      </SectionHeader>
      <section className="card p-6 space-y-4 text-sm leading-6 text-slate-700">
        <h2 className="text-xl font-black text-slate-950">Return requests</h2>
        <p>Contact support with your order number to request a return review before sending any item back.</p>
        <h2 className="text-xl font-black text-slate-950">Restricted items</h2>
        <p>Restricted products may have additional return instructions and destination limitations.</p>
        <h2 className="text-xl font-black text-slate-950">Refund timing</h2>
        <p>Approved refunds are processed after the returned item is received and inspected.</p>
      </section>
    </AppShell>
  );
}
