import { AppShell } from "@/components/ui";
import { CategoryCards, StoreHero, TrustComplianceBand } from "@/components/store/home-sections";

export default function Home() {
  return (
    <AppShell>
      <StoreHero />
      <CategoryCards />
      <TrustComplianceBand />
    </AppShell>
  );
}
