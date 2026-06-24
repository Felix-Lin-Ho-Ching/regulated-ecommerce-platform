"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import { reasonRequiredMessage, validateManualReason, type AdminActionState } from "@/lib/admin/action-state";
import { upsertComplianceRule, upsertVerificationTemplate } from "@/lib/compliance/service";
import { parseComplianceRuleForm, parseVerificationTemplateForm } from "@/lib/compliance/validation";

export async function saveComplianceRuleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const input = parseComplianceRuleForm(formData);
  const noteResult = validateManualReason(input.auditNote);
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  const result = await upsertComplianceRule(input);
  if (typeof result !== "string") return result;

  await createAuditLog({ action: input.id ? "UPDATE" : "CREATE", entityType: "StateRestrictionRule", entityId: result, note: noteResult.note, metadata: { stateCode: input.stateCode, outcome: input.outcome, reviewStatus: input.reviewStatus } });

  revalidatePath("/admin/compliance-rules");
  revalidatePath("/admin/rule-coverage");
  return { ok: true, success: "Compliance rule saved." };
}

export async function saveVerificationTemplateAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const input = parseVerificationTemplateForm(formData);
  const noteResult = validateManualReason(input.auditNote);
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  const id = await upsertVerificationTemplate(input);

  await createAuditLog({ action: "UPDATE", entityType: "VerificationTemplate", entityId: id, note: noteResult.note, metadata: { code: input.code, requirements: input.requirements.length } });

  revalidatePath("/admin/verification-templates");
  revalidatePath("/admin/compliance-rules");
  return { ok: true, success: "Verification template saved." };
}
