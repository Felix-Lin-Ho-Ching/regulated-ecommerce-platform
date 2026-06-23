import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AppShell, SectionHeader } from "@/components/ui";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <SectionHeader eyebrow="Admin" title="Admin login">
        Access the local development operations dashboard.
      </SectionHeader>
      <AdminLoginForm error={sp.error} message={sp.message} next={sp.next} />
    </AppShell>
  );
}
