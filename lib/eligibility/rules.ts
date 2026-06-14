import { complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type EligibilityStatus = "available" | "blocked" | "documents_required" | "manual_review";

export type EligibilityInput = {
  state?: string;
  zip?: string;
  isAtLeast18?: boolean;
  productCategory?: string;
  restricted?: boolean;
};

type ConfiguredRuleRow = {
  stateCode: string;
  productCategory: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
};

export type EligibilityRule = {
  state: string;
  category: string;
  outcome: string;
  coverage: string;
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
  documents_required: "Additional verification required",
  manual_review: "Manual review required",
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
    productCategory = "knuckle_stun_device",
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
      message: "Restricted products are available only after confirming the purchaser is at least 18.",
    };
  }

  const stateCode = normalizeState(state);

  if (!stateCode) {
    return {
      status: "manual_review",
      label: labels.manual_review,
      message: "Enter a shipping state so availability can be reviewed before payment.",
    };
  }

  const rule = rules.find(
    (candidate) => candidate.state === stateCode && candidate.category === productCategory,
  );

  if (!rule || normalizeOutcome(rule.coverage) === "missing" || normalizeOutcome(rule.outcome) === "missing") {
    return {
      status: "manual_review",
      label: labels.manual_review,
      message: "This destination needs review before payment can be offered.",
    };
  }

  const outcome = normalizeOutcome(rule.outcome);
  const coverage = normalizeOutcome(rule.coverage);

  if (outcome === "blocked" || outcome === "block") {
    return {
      status: "blocked",
      label: labels.blocked,
      message: "This restricted product is not available for the selected destination.",
    };
  }

  if (outcome === "pending_document_upload" || outcome === "documents_required") {
    return {
      status: "documents_required",
      label: labels.documents_required,
      message: "Additional verification is required before payment can be offered.",
    };
  }

  if (outcome === "pending_admin_review" || outcome === "manual_review" || coverage === "review_needed") {
    return {
      status: "manual_review",
      label: labels.manual_review,
      message: "This destination requires manual review before payment can be offered.",
    };
  }

  if (outcome === "allowed" || outcome === "allow") {
    return {
      status: "available",
      label: labels.available,
      message: "Availability looks good for this destination. Checkout will review the shipping details again before payment.",
    };
  }

  return {
    status: "manual_review",
    label: labels.manual_review,
    message: "This destination needs review before payment can be offered.",
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
      productCategory: true,
      outcome: true,
      reviewStatus: true,
      reason: true,
    },
  })) as ConfiguredRuleRow[];

  return evaluateEligibilityWithRules(
    input,
    rows.map((rule) => ({
      state: rule.stateCode,
      category: rule.productCategory,
      outcome: rule.outcome,
      coverage: rule.reviewStatus === "MANUAL_REVIEW" ? "review_needed" : "covered",
      note: rule.reason,
    })),
  );
}
