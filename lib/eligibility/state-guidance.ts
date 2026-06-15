import { complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { US_STATE_OPTIONS } from "@/lib/eligibility/states";

export type StateGuidance = {
  stateCode: string;
  status: "Available" | "Restricted" | "Manual review required" | "Not available for online purchase";
  checkoutNote: string;
  warning: string;
};

type RuleRow = {
  stateCode: string;
  productCategory: string;
  outcome: string;
  reviewStatus: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildGuidance(stateCode: string, rule?: RuleRow): StateGuidance {
  const outcome = normalize(rule?.outcome ?? "");
  const reviewStatus = normalize(rule?.reviewStatus ?? "");

  if (!rule) {
    return {
      stateCode,
      status: "Manual review required",
      checkoutNote: "Online checkout may pause until a team member reviews your destination.",
      warning: "No active public rule is configured for this state, so restricted-product orders are not automatically approved.",
    };
  }

  if (outcome === "allow" || outcome === "allowed") {
    return {
      stateCode,
      status: reviewStatus === "manual_review" ? "Manual review required" : "Available",
      checkoutNote: reviewStatus === "manual_review" ? "You can start checkout, but the order may require review before payment." : "You can continue checkout after the required age and address steps.",
      warning: "Restricted products still require truthful eligibility confirmation and destination checks.",
    };
  }

  if (outcome === "block" || outcome === "blocked") {
    return {
      stateCode,
      status: "Not available for online purchase",
      checkoutNote: "Online purchase is not available for this shipping state.",
      warning: "Restricted-product checkout will not collect payment for destinations marked unavailable.",
    };
  }

  if (outcome === "pending_document_upload" || outcome === "documents_required") {
    return {
      stateCode,
      status: "Restricted",
      checkoutNote: "Checkout may require additional eligibility information before payment can continue.",
      warning: "Have your required verification information ready if you choose to proceed.",
    };
  }

  return {
    stateCode,
    status: "Manual review required",
    checkoutNote: "You can start checkout, but the order may pause for a manual eligibility review.",
    warning: "Restricted-product rules for this destination require review before payment or fulfillment can proceed.",
  };
}

export async function getStateGuidance(): Promise<StateGuidance[]> {
  if (!isDatabaseConfigured) {
    const rows = complianceRules.map((rule) => ({
      stateCode: rule.state,
      productCategory: rule.category,
      outcome: rule.outcome,
      reviewStatus: rule.coverage === "review_needed" || rule.coverage === "missing" ? "MANUAL_REVIEW" : "COVERED",
    }));

    return US_STATE_OPTIONS.map((state) => buildGuidance(state.code, rows.find((rule) => rule.stateCode === state.code)));
  }

  const rows = (await prisma.stateRestrictionRule.findMany({
    where: { archivedAt: null },
    select: { stateCode: true, productCategory: true, outcome: true, reviewStatus: true },
    orderBy: [{ stateCode: "asc" }],
  })) as RuleRow[];

  return US_STATE_OPTIONS.map((state) => buildGuidance(state.code, rows.find((rule) => rule.stateCode === state.code)));
}
