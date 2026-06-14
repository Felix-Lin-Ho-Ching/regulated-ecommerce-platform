import { EligibilityModal } from "@/components/eligibility/eligibility-modal";
import { getStorefrontContent } from "@/lib/storefront-content/service";

export async function GlobalEligibilityGate() {
  const storefrontContent = await getStorefrontContent();

  return <EligibilityModal content={storefrontContent} trigger="entry" />;
}
