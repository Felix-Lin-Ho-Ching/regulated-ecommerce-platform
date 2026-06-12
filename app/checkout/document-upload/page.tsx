import Link from "next/link";
import {
  AppShell,
  CheckoutStepper,
  CheckoutSummary,
  DocumentUploadCard,
  SectionHeader,
} from "@/components/ui";

export default function Docs() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Eligibility" title="Required documents">
        Document review is separate from payment and requires admin approval.
      </SectionHeader>
      <CheckoutStepper active={3} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <DocumentUploadCard />
          <Link className="btn btn-secondary mt-4" href="/account/orders/SF-1004">
            View document status
          </Link>
        </div>
        <CheckoutSummary />
      </div>
    </AppShell>
  );
}
