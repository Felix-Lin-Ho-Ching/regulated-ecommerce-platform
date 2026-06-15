import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

export type PublicChecklistValue = "YES" | "NO" | "CHECK STATE GUIDANCE";

export type PublicStateRequirement = {
  stateCode: string;
  stateName: string;
  slug: string;
  legalForConsumerUsePossession: PublicChecklistValue;
  otherRestrictions: PublicChecklistValue;
  minimumAge?: string;
  backgroundCheck?: string;
  permitRequiredForPurchase?: string;
  carryTravelNotes?: string;
  restrictedPersons?: string;
  prohibitedPlaces?: string;
  officialLawUrl?: string;
  publicSummary?: string;
};

const stateSlug = (stateName: string) => stateName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const defaultRequirement = (state: (typeof US_STATE_OPTIONS)[number]): PublicStateRequirement => ({
  stateCode: state.code,
  stateName: state.name,
  slug: stateSlug(state.name),
  legalForConsumerUsePossession: "CHECK STATE GUIDANCE",
  otherRestrictions: "CHECK STATE GUIDANCE",
  minimumAge: "Review current state and local requirements before purchase or carry.",
  backgroundCheck: "Check current state guidance and any local rules that may apply.",
  permitRequiredForPurchase: "Check current state guidance before purchasing a restricted self-defense item.",
  carryTravelNotes: "Rules can change when traveling through cities, counties, public buildings, schools, airports, or private property.",
  restrictedPersons: "People prohibited by law from possessing self-defense devices must not purchase or carry them.",
  prohibitedPlaces: "Review state and local restrictions for schools, government buildings, secured facilities, airports, and posted private property.",
  officialLawUrl: undefined,
  publicSummary: `Stun Fry shoppers in ${state.name} should review current state and local requirements before purchasing or carrying a restricted self-defense item.`,
});

const overrides: Record<string, Partial<PublicStateRequirement>> = {
  AL: {
    publicSummary: "Alabama shoppers should verify current state and local rules for purchase, possession, carry, and restricted locations before ordering a Stun Fry self-defense item.",
  },
  AK: {
    publicSummary: "Alaska shoppers should check current statewide rules plus local restrictions that may apply when carrying or transporting a self-defense item.",
  },
  CA: {
    legalForConsumerUsePossession: "CHECK STATE GUIDANCE",
    otherRestrictions: "YES",
    minimumAge: "California may set age, product-type, and location limits. Review current state guidance before purchase.",
    carryTravelNotes: "Local ordinances and sensitive-location rules may affect carry or transport.",
    publicSummary: "California requirements can be more detailed than many states. Review current state and local guidance before buying, carrying, or traveling with a restricted self-defense item.",
  },
  HI: {
    legalForConsumerUsePossession: "CHECK STATE GUIDANCE",
    otherRestrictions: "YES",
    permitRequiredForPurchase: "Review current Hawaii purchase requirements before ordering.",
    publicSummary: "Hawaii shoppers should review current purchase, possession, carry, and travel requirements before ordering a restricted self-defense item.",
  },
  TX: {
    publicSummary: "Texas shoppers should still confirm current state and local rules for age, possession, carry, and places where self-defense items may not be allowed.",
  },
  DC: {
    legalForConsumerUsePossession: "CHECK STATE GUIDANCE",
    otherRestrictions: "YES",
    publicSummary: "District of Columbia shoppers should verify current District requirements and destination limits before purchasing a restricted self-defense item.",
  },
};

export const PUBLIC_STATE_REQUIREMENTS: PublicStateRequirement[] = US_STATE_OPTIONS.map((state) => ({
  ...defaultRequirement(state),
  ...overrides[state.code],
}));

export function getPublicStateRequirementByCode(stateCode: string) {
  return PUBLIC_STATE_REQUIREMENTS.find((requirement) => requirement.stateCode === stateCode.toUpperCase());
}

export function getPublicStateRequirementBySlug(slug: string) {
  return PUBLIC_STATE_REQUIREMENTS.find((requirement) => requirement.slug === slug);
}
