import { complianceRules } from "@/lib/mock-data";

export type EligibilityStatus = "available" | "blocked" | "documents_required" | "manual_review";

export type EligibilityInput = {
  state?: string;
  zip?: string;
  isAtLeast18?: boolean;
  productCategory?: string;
  restricted?: boolean;
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

export function evaluateEligibility({
  state,
  isAtLeast18,
  productCategory = "knuckle_stun_device",
  restricted = true,
}: EligibilityInput): EligibilityResult {
  if (!restricted) {
    return { status: "available", label: labels.available, message: "This item is available for standard checkout review." };
  }
  if (isAtLeast18 === false) {
    return { status: "blocked", label: labels.blocked, message: "Restricted products are not available unless you confirm you are at least 18." };
  }
  const stateCode = normalizeState(state);
  if (!stateCode) {
    return { status: "manual_review", label: labels.manual_review, message: "Enter a shipping state to preview availability. Missing rules require review." };
  }
  const rule = complianceRules.find((candidate) => candidate.state === stateCode && candidate.category === productCategory);
  if (!rule || rule.coverage === "missing" || rule.outcome === "missing") {
    return { status: "manual_review", label: labels.manual_review, message: "We need to review this destination before payment can be offered." };
  }
  if (rule.outcome === "blocked") {
    return { status: "blocked", label: labels.blocked, message: "This restricted product is not available for the selected destination." };
  }
  if (rule.outcome === "pending_document_upload") {
    return { status: "documents_required", label: labels.documents_required, message: "Additional verification required before payment." };
  }
  if (rule.outcome === "pending_admin_review" || rule.coverage === "review_needed") {
    return { status: "manual_review", label: labels.manual_review, message: "Manual review required before payment." };
  }
  if (rule.outcome === "allowed") {
    return { status: "available", label: labels.available, message: "Availability looks good for this destination, subject to checkout address review." };
  }
  return { status: "manual_review", label: labels.manual_review, message: "We need to review this destination before payment can be offered." };
}
