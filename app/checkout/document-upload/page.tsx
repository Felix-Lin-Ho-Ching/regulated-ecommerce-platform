import Link from "next/link";
import { AppShell, CheckoutStepper, CheckoutSummary, DocumentUploadCard, SectionHeader } from "@/components/ui";

export default function Docs() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Required documents">
        Documents are part of the eligibility step and must be approved before mock payment is available.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <DocumentUploadCard />
          <Link className="btn btn-secondary mt-4" href="/account/orders/CG-1004">
            View document status
          </Link>
        </div>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
