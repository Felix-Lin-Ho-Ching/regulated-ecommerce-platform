import { AppShell } from "@/components/ui";
import { MyStateChecker } from "@/components/my-state/my-state-checker";
import { getStateGuidance } from "@/lib/eligibility/state-guidance";

export default async function MyStatePage() {
  const guidance = await getStateGuidance();

  return (
    <AppShell>
      <MyStateChecker guidance={guidance} />
    </AppShell>
  );
}
