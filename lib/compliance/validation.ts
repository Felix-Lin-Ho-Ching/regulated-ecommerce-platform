export const ruleOutcomes = ["ALLOW", "BLOCK"] as const;
export const ruleReviewStatuses = ["DRAFT", "MANUAL_REVIEW", "COUNSEL_REVIEW_REQUIRED", "INACTIVE", "ARCHIVED"] as const;

export type ComplianceRuleInput = {
  id?: string;
  stateCode: string;
  restrictedClass: string;
  productId?: string;
  outcome: (typeof ruleOutcomes)[number];
  reviewStatus: (typeof ruleReviewStatuses)[number];
  reason: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  verificationTemplateId: string;
  auditNote: string;
  legalSourceNote: string;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(value: string, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function parseDate(value: string, fallback?: Date): Date | undefined {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function parseComplianceRuleForm(formData: FormData): ComplianceRuleInput {
  const today = new Date();

  return {
    id: text(formData, "id") || undefined,
    stateCode: text(formData, "stateCode").toUpperCase().slice(0, 2) || "UN",
    restrictedClass: text(formData, "restrictedClass") || "STUN_GUN",
    productId: text(formData, "productId") || undefined,
    outcome: oneOf(text(formData, "outcome"), ruleOutcomes, "BLOCK"),
    reviewStatus: oneOf(text(formData, "reviewStatus"), ruleReviewStatuses, "DRAFT"),
    reason: text(formData, "reason") || "Owner-managed destination rule.",
    effectiveFrom: parseDate(text(formData, "effectiveFrom"), today) ?? today,
    effectiveTo: parseDate(text(formData, "effectiveTo")),
    verificationTemplateId: text(formData, "verificationTemplateId"),
    auditNote: text(formData, "auditNote"),
    legalSourceNote: text(formData, "legalSourceNote"),
  };
}

export const verificationTemplateCodes = [
  "AGE_18_ATTESTATION_ONLY",
  "AGE_18_ID_VERIFICATION",
  "AGE_21_ID_VERIFICATION",
  "FOID_OR_PERMIT_REQUIRED",
  "LICENSE_TO_CARRY_OR_FIREARM_ID_REQUIRED",
  "LOCAL_LICENSE_BACKGROUND_BRIEFING_REQUIRED",
  "SELLER_LICENSE_OR_VOLUME_THRESHOLD_REQUIRED",
  "BLOCKED",
  "MANUAL_REVIEW_DEFAULT",
] as const;

export const verificationRequirementTypes = [
  "ATTESTATION",
  "ID_DOCUMENT",
  "PERMIT",
  "LOCAL_LICENSE",
  "SELLER_LICENSE",
  "BACKGROUND_BRIEFING",
  "MANUAL_REVIEW",
  "BLOCKED",
] as const;

export type VerificationTemplateInput = {
  code: (typeof verificationTemplateCodes)[number];
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  requirements: Array<{
    type: (typeof verificationRequirementTypes)[number];
    label: string;
    required: boolean;
  }>;
  auditNote: string;
};

export function parseVerificationTemplateForm(formData: FormData): VerificationTemplateInput {
  return {
    code: oneOf(text(formData, "code"), verificationTemplateCodes, "MANUAL_REVIEW_DEFAULT"),
    name: text(formData, "name") || "Manual review default",
    description: text(formData, "description") || "Owner-managed verification workflow template.",
    status: oneOf(text(formData, "status"), ["ACTIVE", "INACTIVE", "ARCHIVED"] as const, "ACTIVE"),
    requirements: [0, 1, 2, 3]
      .map((index) => ({
        type: oneOf(text(formData, `requirementType${index}`), verificationRequirementTypes, "MANUAL_REVIEW"),
        label: text(formData, `requirementLabel${index}`),
        required: formData.get(`requirementRequired${index}`) === "on",
      }))
      .filter((requirement) => requirement.label),
    auditNote: text(formData, "auditNote"),
  };
}

export type LocalRestrictionRuleInput = {
  stateCode: string;
  localityType: string;
  localityName: string;
  restrictedClass: string;
  productId?: string;
  outcome: (typeof ruleOutcomes)[number];
  reason: string;
  auditNote: string;
};

export function parseLocalRestrictionRuleForm(formData: FormData): LocalRestrictionRuleInput {
  return {
    stateCode: text(formData, "localStateCode").toUpperCase().slice(0, 2) || "UN",
    localityType: text(formData, "localityType").toUpperCase() || "ZIP",
    localityName: text(formData, "localityName").toUpperCase().replace(/\s+/g, "") || "Unknown",
    restrictedClass: text(formData, "localRestrictedClass") || "STUN_GUN",
    productId: text(formData, "localProductId") || undefined,
    outcome: oneOf(text(formData, "localOutcome"), ruleOutcomes, "BLOCK"),
    reason: text(formData, "localReason") || "Local shipping restriction.",
    auditNote: text(formData, "localAuditNote"),
  };
}
