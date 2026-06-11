import { prisma } from "@/lib/db/prisma";

export type ComplianceInput = {
  productCategory: "knuckle_stun_device" | string;
  stateCode: string;
  localityName?: string;
};

export type ComplianceDecision = {
  outcome: "ALLOW" | "BLOCK" | "MANUAL_REVIEW" | "DOCUMENTS_REQUIRED";
  reasons: string[];
  automaticFirst: boolean;
  paymentAllowed: boolean;
};

type RestrictionRule = {
  outcome: ComplianceDecision["outcome"];
  reviewStatus: string;
  reason: string;
};

export async function evaluateCompliance(input: ComplianceInput): Promise<ComplianceDecision> {
  const rule = await prisma.stateRestrictionRule.findFirst({
    where: {
      stateCode: input.stateCode,
      productCategory: input.productCategory,
      archivedAt: null,
    },
    orderBy: { createdAt: "desc" },
  }) as RestrictionRule | null;

  if (!rule) {
    return {
      outcome: "MANUAL_REVIEW",
      reasons: ["No active rule was found; restricted-product checkout cannot pass on missing rules."],
      automaticFirst: true,
      paymentAllowed: false,
    };
  }

  const paymentAllowed = rule.outcome === "ALLOW" && rule.reviewStatus !== "MANUAL_REVIEW";

  return {
    outcome: rule.outcome,
    reasons: [rule.reason],
    automaticFirst: true,
    paymentAllowed,
  };
}
