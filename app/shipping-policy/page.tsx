import { AppShell, SectionHeader } from "@/components/ui";

export default function Page() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Policy" title="Shipping policy">
        Shipping options depend on destination, inventory, and restricted-product eligibility.
      </SectionHeader>
      <section className="card p-6 space-y-4 text-sm leading-6 text-slate-700">
        <h2 className="text-xl font-black text-slate-950">Destinations</h2>
        <p>Shipping addresses are reviewed before payment for restricted products. Some destinations may be unavailable.</p>
        <h2 className="text-xl font-black text-slate-950">Processing</h2>
        <p>Orders ship after inventory confirmation, eligibility approval, and any required verification review.</p>
        <h2 className="text-xl font-black text-slate-950">Delivery holds</h2>
        <p>Restricted-product orders may remain on hold until all required customer and destination checks are complete.</p>
      </section>
    </AppShell>
  );
}
