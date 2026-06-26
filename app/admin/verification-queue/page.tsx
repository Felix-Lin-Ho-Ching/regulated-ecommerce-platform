import { AdminShell, AlertPanel } from "@/components/ui";

export default function VerificationQueuePage() {
  return (
    <AdminShell title="Verification queue" currentPath="/admin/verification-queue">
      <AlertPanel title="Verification queue is not active" tone="info">
        Verification queue is not active in order-request mode. Restricted checkout is handled by state/ZIP rules and order review.
      </AlertPanel>
    </AdminShell>
  );
}
