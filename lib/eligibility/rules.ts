import { complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type EligibilityStatus = "available" | "blocked" | "documents_required" | "needs_verification";

export type EligibilityInput = {
  state?: string;
  zip?: string;
  isAtLeast18?: boolean;
  restrictedClass?: string;
  productId?: string;
  restricted?: boolean;
};

type ConfiguredRuleRow = {
  stateCode: string;
  restrictedClass: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
  productId: string | null;
};

export type EligibilityRule = {
  state: string;
  category: string;
  outcome: string;
  coverage: string;
  productId?: string | null;
  note?: string;
};

export type EligibilityResult = {
  status: EligibilityStatus;
  label: string;
  message: string;
};

const labels: Record<EligibilityStatus, string> = {
  available: "Available",
  blocked: "Not available in your area",
  documents_required: "Verification required",
  needs_verification: "Verification required",
};

function normalizeState(state?: string) {
  return state?.trim().toUpperCase().slice(0, 2) ?? "";
}

function normalizeOutcome(outcome?: string) {
  return (outcome || "").trim().toLowerCase();
}

export function evaluateEligibilityWithRules(
  input: EligibilityInput,
  rules: EligibilityRule[],
): EligibilityResult {
  const {
    state,
    isAtLeast18,
    restrictedClass,
    productId,
    restricted = true,
  } = input;

  if (!restricted) {
    return {
      status: "available",
      label: labels.available,
      message: "This item is available for checkout.",
    };
  }

  if (!isAtLeast18) {
    return {
      status: "blocked",
      label: labels.blocked,
      message: "Restricted items require age confirmation during checkout."
    };
  }

  if (!restrictedClass) {
    return {
      status: "blocked",
      label: labels.blocked,
      message: "This item is not available because restricted classification is missing."
    };
  }

  const stateCode = normalizeState(state);

  if (!stateCode) {
    return {
      status: "needs_verification",
      label: labels.needs_verification,
      message: "Enter a shipping state to continue checkout."
    };
  }

  const matchingRules = rules.filter(
    (candidate) => candidate.state === stateCode && candidate.category === restrictedClass,
  );
  const rule =
    matchingRules.find((candidate) => productId && candidate.productId === productId) ??
    matchingRules.find((candidate) => !candidate.productId);

  if (!rule || normalizeOutcome(rule.coverage) === "missing" || normalizeOutcome(rule.outcome) === "missing") {
    return {
      status: "blocked",
      label: labels.blocked,
      message: "This item is not available for your shipping destination."
    };
  }

  const outcome = normalizeOutcome(rule.outcome);

  if (outcome === "blocked" || outcome === "block") {
    return {
      status: "blocked",
      label: labels.blocked,
      message: "This item is not available for your shipping destination."
    };
  }

  if (outcome === "allowed" || outcome === "allow") {
    return {
      status: "available",
      label: labels.available,
      message: "Your shipping destination is eligible for checkout."
    };
  }

  return {
    status: "blocked",
    label: labels.blocked,
    message: "This item is not available for your shipping destination."
  };
}

export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  return evaluateEligibilityWithRules(input, complianceRules);
}

export async function evaluateEligibilityFromConfiguredRules(
  input: EligibilityInput,
): Promise<EligibilityResult> {
  if (!isDatabaseConfigured) {
    return evaluateEligibility(input);
  }

  const rows = (await prisma.stateRestrictionRule.findMany({
    where: { archivedAt: null },
    select: {
      stateCode: true,
      restrictedClass: true,
      outcome: true,
      reviewStatus: true,
      reason: true,
      productId: true,
    },
  })) as ConfiguredRuleRow[];

  return evaluateEligibilityWithRules(
    input,
    rows.map((rule) => ({
      state: rule.stateCode,
      category: rule.restrictedClass,
      outcome: rule.outcome,
      coverage: "covered",
      productId: rule.productId,
      note: rule.reason,
    })),
  );
}
