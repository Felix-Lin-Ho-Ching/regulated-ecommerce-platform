import { AppShell, SectionHeader } from "@/components/ui";

export default function Page() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Policy" title="Privacy policy">
        How Stun Fry handles shopper information used for orders, eligibility review, and support.
      </SectionHeader>
      <section className="card p-6 space-y-4 text-sm leading-6 text-slate-700">
        <h2 className="text-xl font-black text-slate-950">Information we collect</h2>
        <p>We collect contact, shipping, cart, eligibility attestation, and order status information needed to operate the store and respond to support requests.</p>
        <h2 className="text-xl font-black text-slate-950">How information is used</h2>
        <p>Information is used to review destination availability, manage orders, prevent misuse, and communicate order or policy updates.</p>
        <h2 className="text-xl font-black text-slate-950">Restricted-product review</h2>
        <p>Age attestations, destination details, and document status may be reviewed before payment is made available for restricted products.</p>
      </section>
    </AppShell>
  );
}
