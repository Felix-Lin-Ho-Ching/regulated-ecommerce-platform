import { AppShell, SectionHeader } from "@/components/ui";
import { LoginForm } from "@/components/account/auth-forms";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <SectionHeader eyebrow="Account" title="Log in to Stun Fry">
        Access protected account pages and continue checkout with your customer session.
      </SectionHeader>
      <LoginForm error={sp.error} message={sp.message} next={sp.next} />
    </AppShell>
  );
}
