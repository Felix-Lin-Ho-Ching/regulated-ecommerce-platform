"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { upsertComplianceRule, upsertVerificationTemplate } from "@/lib/compliance/service";
import { parseComplianceRuleForm, parseVerificationTemplateForm } from "@/lib/compliance/validation";

export async function saveComplianceRuleAction(formData: FormData) {
  const input = parseComplianceRuleForm(formData);
  const note = requireAuditNote(input.auditNote, "Compliance rule change");
  const id = await upsertComplianceRule(input);

  await createAuditLog({
    action: input.id ? "UPDATE" : "CREATE",
    entityType: "StateRestrictionRule",
    entityId: id,
    note,
    metadata: { stateCode: input.stateCode, outcome: input.outcome, reviewStatus: input.reviewStatus },
  });

  revalidatePath("/admin/compliance-rules");
  revalidatePath("/admin/rule-coverage");
}


export async function saveVerificationTemplateAction(formData: FormData) {
  const input = parseVerificationTemplateForm(formData);
  const note = requireAuditNote(input.auditNote, "Verification template change");
  const id = await upsertVerificationTemplate(input);

  await createAuditLog({
    action: "UPDATE",
    entityType: "VerificationTemplate",
    entityId: id,
    note,
    metadata: { code: input.code, requirements: input.requirements.length },
  });

  revalidatePath("/admin/verification-templates");
  revalidatePath("/admin/compliance-rules");
}
