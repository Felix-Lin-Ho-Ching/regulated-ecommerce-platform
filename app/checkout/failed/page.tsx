import Link from "next/link";
import { AlertPanel, AppShell, SectionHeader } from "@/components/ui";

export default function Failed() {
  return (
    <AppShell>
      <SectionHeader eyebrow="Payment failed" title="Payment was not completed">
        Eligibility remains approved; payment can be retried.
      </SectionHeader>
      <AlertPanel title="Payment review issue" tone="danger">
        No order funds were captured. Retry payment review or contact support.
      </AlertPanel>
      <Link className="btn btn-primary mt-5" href="/checkout/payment">
        Retry payment
      </Link>
    </AppShell>
  );
}
