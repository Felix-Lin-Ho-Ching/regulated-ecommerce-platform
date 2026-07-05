"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import { reasonRequiredMessage, validateManualReason, type AdminActionState } from "@/lib/admin/action-state";
import { createLocalRestrictionRule, upsertComplianceRule, upsertVerificationTemplate } from "@/lib/compliance/service";
import { parseComplianceRuleForm, parseLocalRestrictionRuleForm, parseVerificationTemplateForm } from "@/lib/compliance/validation";
import { requireOwnerOrAdminAction } from "@/lib/admin/authorization";

export async function saveComplianceRuleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/compliance-rules");
  if ("error" in auth) return auth;
  let input;
  try { input = parseComplianceRuleForm(formData); } catch (error) { return { error: error instanceof Error ? error.message : "Compliance form is invalid." }; }
  const noteResult = validateManualReason(input.auditNote);
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  const result = await upsertComplianceRule(input);
  if (typeof result !== "string") return result;

  await createAuditLog({ action: input.id ? "UPDATE" : "CREATE", entityType: "StateRestrictionRule", entityId: result, note: noteResult.note, metadata: { stateCode: input.stateCode, outcome: input.outcome, reviewStatus: input.reviewStatus } });

  revalidatePath("/admin/compliance-rules");
  revalidatePath("/admin/rule-coverage");
  return { ok: true, success: "Compliance rule saved." };
}

export async function saveLocalRestrictionRuleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/compliance-rules");
  if ("error" in auth) return auth;
  let input;
  try { input = parseLocalRestrictionRuleForm(formData); } catch (error) { return { error: error instanceof Error ? error.message : "Compliance form is invalid." }; }
  const noteResult = validateManualReason(input.auditNote);
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  const result = await createLocalRestrictionRule(input);
  if (typeof result !== "string") return result;

  await createAuditLog({
    action: "CREATE",
    entityType: "LocalRestrictionRule",
    entityId: result,
    note: noteResult.note,
    metadata: { stateCode: input.stateCode, localityType: input.localityType, localityName: input.localityName, outcome: input.outcome },
  });

  revalidatePath("/admin/compliance-rules");
  return { ok: true, success: "Local restriction rule saved." };
}

export async function saveVerificationTemplateAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/verification-templates");
  if ("error" in auth) return auth;
  const input = parseVerificationTemplateForm(formData);
  const noteResult = validateManualReason(input.auditNote);
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  const id = await upsertVerificationTemplate(input);

  await createAuditLog({ action: "UPDATE", entityType: "VerificationTemplate", entityId: id, note: noteResult.note, metadata: { code: input.code, requirements: input.requirements.length } });

  revalidatePath("/admin/verification-templates");
  revalidatePath("/admin/compliance-rules");
  return { ok: true, success: "Verification template saved." };
}
