import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { complianceRules, verificationTemplates as mockTemplates } from "@/lib/mock-data";
import type { ComplianceRuleInput, VerificationTemplateInput } from "@/lib/compliance/validation";

export type ComplianceRuleRow = {
  id: string;
  stateCode: string;
  productCategory: string;
  productName: string;
  productId: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
  effectiveFrom: string;
  effectiveTo: string;
  verificationTemplateId: string;
  verificationTemplateName: string;
};

export type VerificationTemplateRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  requirements: string[];
};

export async function getVerificationTemplates(): Promise<VerificationTemplateRow[]> {
  if (!isDatabaseConfigured) {
    return mockTemplates.map((template) => ({
      id: template.name,
      code: template.name.toUpperCase().replaceAll(" ", "_"),
      name: template.name,
      description: `${template.category} workflow template. Mock only, not legal advice.`,
      status: "ACTIVE",
      requirements: template.requirements,
    }));
  }

  const rows = await prisma.verificationTemplate.findMany({
    where: { archivedAt: null },
    include: { requirements: { orderBy: { sortOrder: "asc" } } },
    orderBy: { code: "asc" },
  });

  return rows.map((template: any) => ({
    id: template.id,
    code: template.code,
    name: template.name,
    description: template.description,
    status: template.status,
    requirements: template.requirements.map((requirement: any) => requirement.label),
  }));
}

export async function getComplianceRules(): Promise<ComplianceRuleRow[]> {
  if (!isDatabaseConfigured) {
    return complianceRules.map((rule) => ({
      id: rule.id,
      stateCode: rule.state,
      productCategory: rule.category,
      productName: "All products in category",
      productId: "",
      outcome: rule.outcome === "docs_required" ? "MANUAL_REVIEW" : rule.outcome.toUpperCase(),
      reviewStatus: "MANUAL_REVIEW",
      reason: rule.note,
      effectiveFrom: "",
      effectiveTo: "",
      verificationTemplateId: "",
      verificationTemplateName: "Manual review default",
    }));
  }

  const [rules, verificationRules] = await Promise.all([
    prisma.stateRestrictionRule.findMany({
      where: { archivedAt: null },
      include: { product: true },
      orderBy: [{ stateCode: "asc" }, { productCategory: "asc" }],
    }),
    prisma.stateVerificationRule.findMany({ include: { template: true }, where: { archivedAt: null } }),
  ]);

  return rules.map((rule: any) => {
    const verificationRule = verificationRules.find(
      (item: any) => item.stateCode === rule.stateCode && item.productCategory === rule.productCategory,
    );

    return {
      id: rule.id,
      stateCode: rule.stateCode,
      productCategory: rule.productCategory,
      productName: rule.product?.name ?? "All products in category",
      productId: rule.productId ?? "",
      outcome: rule.outcome,
      reviewStatus: rule.reviewStatus,
      reason: rule.reason,
      effectiveFrom: rule.effectiveFrom?.toISOString().slice(0, 10) ?? "",
      effectiveTo: rule.effectiveTo?.toISOString().slice(0, 10) ?? "",
      verificationTemplateId: verificationRule?.templateId ?? "",
      verificationTemplateName: verificationRule?.template?.name ?? "Manual review default",
    };
  });
}

export async function upsertComplianceRule(input: ComplianceRuleInput): Promise<string> {
  if (!isDatabaseConfigured) return input.id ?? "mock-rule";

  const template = input.verificationTemplateId
    ? await prisma.verificationTemplate.findUnique({ where: { id: input.verificationTemplateId } })
    : await prisma.verificationTemplate.findUnique({ where: { code: "MANUAL_REVIEW_DEFAULT" } });

  if (!template) throw new Error("Verification template is required.");

  const rule = input.id
    ? await prisma.stateRestrictionRule.update({
        where: { id: input.id },
        data: {
          stateCode: input.stateCode,
          productCategory: input.productCategory,
          productId: input.productId,
          outcome: input.outcome,
          reviewStatus: input.reviewStatus,
          reason: input.reason,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo,
        },
      })
    : await prisma.stateRestrictionRule.create({
        data: {
          stateCode: input.stateCode,
          productCategory: input.productCategory,
          productId: input.productId,
          outcome: input.outcome,
          reviewStatus: input.reviewStatus,
          reason: input.reason,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo,
        },
      });

  await prisma.stateVerificationRule.upsert({
    where: { stateCode_productCategory: { stateCode: input.stateCode, productCategory: input.productCategory } },
    update: { templateId: template.id, reviewStatus: input.reviewStatus, reason: input.reason },
    create: {
      stateCode: input.stateCode,
      productCategory: input.productCategory,
      templateId: template.id,
      reviewStatus: input.reviewStatus,
      reason: input.reason,
    },
  });

  return rule.id as string;
}


export async function upsertVerificationTemplate(input: VerificationTemplateInput): Promise<string> {
  if (!isDatabaseConfigured) return input.code;

  const template = await prisma.verificationTemplate.upsert({
    where: { code: input.code },
    update: { name: input.name, description: input.description, status: input.status },
    create: { code: input.code, name: input.name, description: input.description, status: input.status },
  });

  await prisma.verificationRequirement.deleteMany({ where: { templateId: template.id } });

  for (const [index, requirement] of input.requirements.entries()) {
    await prisma.verificationRequirement.create({
      data: {
        templateId: template.id,
        type: requirement.type,
        label: requirement.label,
        required: requirement.required,
        sortOrder: index,
      },
    });
  }

  return template.id as string;
}
