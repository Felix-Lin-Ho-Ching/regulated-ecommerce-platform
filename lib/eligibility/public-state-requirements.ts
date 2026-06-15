import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

export type PublicChecklistValue = "YES" | "NO";

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
  legalForConsumerUsePossession: "YES",
  otherRestrictions: "YES",
  minimumAge: "Review current official state and local requirements before purchase or carry.",
  backgroundCheck: "Review current official state resources and any local rules that may apply.",
  permitRequiredForPurchase: "Review current official state resources before purchasing a restricted self-defense item.",
  carryTravelNotes: "Rules can change when traveling through cities, counties, public buildings, schools, airports, or private property.",
  restrictedPersons: "People prohibited by law from possessing self-defense devices must not purchase or carry them.",
  prohibitedPlaces: "Review state and local restrictions for schools, government buildings, secured facilities, airports, and posted private property.",
  officialLawUrl: undefined,
  publicSummary: `Stun Fry shoppers in ${state.name} should review current official state and local requirements before purchasing or carrying a restricted self-defense item.`,
});

const overrides: Record<string, Partial<PublicStateRequirement>> = {
  AL: {
    publicSummary: "Alabama shoppers should verify current state and local rules for purchase, possession, carry, and restricted locations before ordering a Stun Fry self-defense item.",
  },
  AK: {
    publicSummary: "Alaska shoppers should check current statewide rules plus local restrictions that may apply when carrying or transporting a self-defense item.",
  },
  CA: {
    legalForConsumerUsePossession: "YES",
    otherRestrictions: "YES",
    minimumAge: "California may set age, product-type, and location limits. Review current official state resources before purchase.",
    carryTravelNotes: "Local ordinances and sensitive-location rules may affect carry or transport.",
    publicSummary: "California requirements can be more detailed than many states. Review current official state and local resources before buying, carrying, or traveling with a restricted self-defense item.",
  },
  HI: {
    legalForConsumerUsePossession: "NO",
    otherRestrictions: "YES",
    permitRequiredForPurchase: "Review current official Hawaii purchase requirements before ordering.",
    publicSummary: "Hawaii shoppers should review current purchase, possession, carry, and travel requirements before ordering a restricted self-defense item.",
  },
  TX: {
    publicSummary: "Texas shoppers should still confirm current state and local rules for age, possession, carry, and places where self-defense items may not be allowed.",
  },
  DC: {
    legalForConsumerUsePossession: "YES",
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


const missingPublicChecklistValues = PUBLIC_STATE_REQUIREMENTS.filter(
  (requirement) => !["YES", "NO"].includes(requirement.legalForConsumerUsePossession) || !["YES", "NO"].includes(requirement.otherRestrictions),
);

if (missingPublicChecklistValues.length > 0) {
  throw new Error(`Missing public YES/NO checklist values for: ${missingPublicChecklistValues.map((state) => state.stateCode).join(", ")}`);
}
