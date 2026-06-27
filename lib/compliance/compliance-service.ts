import { prisma } from "@/lib/db/prisma";

export type ComplianceInput = {
  productCategory: "knuckle_stun_device" | string;
  stateCode: string;
  localityName?: string;
};
export type ComplianceDecision = {
  outcome: "ALLOW" | "BLOCK";
  reasons: string[];
  automaticFirst: boolean;
  paymentAllowed: boolean;
};

type RestrictionRuleRow = {
  outcome: ComplianceDecision["outcome"];
  reviewStatus: string;
  reason: string;
} | null;

export async function evaluateCompliance(input: ComplianceInput): Promise<ComplianceDecision> {
  const rule = (await prisma.stateRestrictionRule.findFirst({
    where: {
      stateCode: input.stateCode,
      productCategory: input.productCategory as never,
      archivedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })) as RestrictionRuleRow;

  if (!rule) {
    return {
      outcome: "BLOCK",
      reasons: ["No active rule was found; restricted-product checkout cannot pass on missing rules."],
      automaticFirst: true,
      paymentAllowed: false,
    };
  }

  const paymentAllowed = rule.outcome === "ALLOW" && rule.reviewStatus !== "MANUAL_REVIEW";

  return { outcome: rule.outcome, reasons: [rule.reason], automaticFirst: true, paymentAllowed };
}
