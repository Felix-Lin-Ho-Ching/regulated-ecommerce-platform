import { AppShell, SectionHeader, AlertPanel } from "@/components/ui";

export default function Page() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Policy" title="Restricted-products policy">
        Stun Fry reviews restricted products by age attestation, shipping destination, category, and any required verification before payment.
      </SectionHeader>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="card p-6 space-y-4 text-sm leading-6 text-slate-700">
          <h2 className="text-xl font-black text-slate-950">Eligibility review</h2>
          <p>Restricted products require confirmation that the purchaser is at least 18 and that the shipping destination is eligible for the product category.</p>
          <h2 className="text-xl font-black text-slate-950">Destination availability</h2>
          <p>State and ZIP information may indicate that an item is available, unavailable, or needs additional verification. Missing rules are handled by review instead of automatic approval.</p>
          <h2 className="text-xl font-black text-slate-950">Verification</h2>
          <p>Some orders may require documents or staff review before payment is available. The initial availability check is only a preview; checkout re-checks the shipping address.</p>
          <h2 className="text-xl font-black text-slate-950">Order holds</h2>
          <p>Stun Fry may hold or decline orders when destination, age, verification, inventory, or policy requirements are not satisfied.</p>
        </section>
        <AlertPanel title="Customer reminder" tone="warning">
          Availability previews are not final approval. Payment is available after checkout eligibility is approved.
        </AlertPanel>
      </div>
    </AppShell>
  );
}
