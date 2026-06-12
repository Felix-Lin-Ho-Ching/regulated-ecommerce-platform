import Link from "next/link";
import { AlertPanel, AppShell, SectionHeader } from "@/components/ui";

export default function Failed() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Payment failed" title="Mock payment was not completed">
        Eligibility remains approved; payment can be retried.
      </SectionHeader>
      <AlertPanel title="Mock processor failure" tone="danger">
        No order funds were captured. Retry mock payment or contact support.
      </AlertPanel>
      <Link className="btn btn-primary mt-5" href="/checkout/payment">
        Retry payment
      </Link>
    </AppShell>
  );
}
