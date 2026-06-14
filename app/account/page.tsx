import { AppShell, SectionHeader } from "@/components/ui";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { requireCustomerSession } from "@/lib/auth/session";

export default async function Account() {
  const session = await requireCustomerSession("/account");

  return (
    <AppShell>
      <SectionHeader eyebrow="Account" title="Customer dashboard">
        Track account details, saved addresses, verification reviews, and order history.
      </SectionHeader>
      <AccountDashboard session={session} />
    </AppShell>
  );
}
