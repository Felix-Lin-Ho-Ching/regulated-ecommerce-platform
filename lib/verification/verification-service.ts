import { prisma } from "@/lib/db/prisma";

export type VerificationPlan = { templateCode: string; requirements: string[]; automaticFirst: boolean; needsAdminReview: boolean };

export async function getVerificationPlan(stateCode: string, productCategory: string): Promise<VerificationPlan> {
  const rule = await prisma.stateVerificationRule.findUnique({
    where: { stateCode_productCategory: { stateCode, productCategory: productCategory as never } },
    include: { template: { include: { requirements: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!rule) {
    return { templateCode: "MANUAL_REVIEW_DEFAULT", requirements: ["Manual review required because the verification rule is missing."], automaticFirst: true, needsAdminReview: true };
  }
  return { templateCode: rule.template.code, requirements: rule.template.requirements.map((requirement) => requirement.label), automaticFirst: true, needsAdminReview: rule.reviewStatus === "MANUAL_REVIEW" };
}
