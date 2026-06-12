import { AppShell, SectionHeader } from "@/components/ui";
import { SignupForm } from "@/components/account/auth-forms";

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <SectionHeader eyebrow="Account" title="Create your Stun Fry account">
        Register to view protected account pages, saved addresses, and local mock order history.
      </SectionHeader>
      <SignupForm error={sp.error} next={sp.next} />
    </AppShell>
  );
}
