import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AppShell, SectionHeader } from "@/components/ui";

export default async function StaffLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <SectionHeader eyebrow="Staff" title="Internal staff login">
        Access the shared internal operations portal for owner, admin, and fulfillment staff.
      </SectionHeader>
      <AdminLoginForm error={sp.error} message={sp.message} next={sp.next} />
    </AppShell>
  );
}
