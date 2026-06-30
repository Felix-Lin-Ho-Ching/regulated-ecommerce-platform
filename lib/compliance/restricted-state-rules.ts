export const restrictedRestrictedClass = "STUN_GUN";

export const usStateAndDcCodes = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const expectedRestrictedStateRuleCount = usStateAndDcCodes.length;

export const defaultRestrictedStateBlockReason =
  "Blocked by default until owner-approved legal review allows this destination.";

export const unsafeDestinationOutcomes = ["MANUAL_REVIEW", "DOCUMENTS_REQUIRED"] as const;

export function isCoveredStateCode(stateCode: string) {
  return usStateAndDcCodes.includes(stateCode as (typeof usStateAndDcCodes)[number]);
}
