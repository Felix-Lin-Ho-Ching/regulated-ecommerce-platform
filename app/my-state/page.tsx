import { AppShell } from "@/components/ui";
import { MyStateChecker } from "@/components/my-state/my-state-checker";
import { PUBLIC_STATE_REQUIREMENTS } from "@/lib/eligibility/public-state-requirements";

export default function MyStatePage() {
  return (
    <AppShell>
      <MyStateChecker requirements={PUBLIC_STATE_REQUIREMENTS} />
    </AppShell>
  );
}
