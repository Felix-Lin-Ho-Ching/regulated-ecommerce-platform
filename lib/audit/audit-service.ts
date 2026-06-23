import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type AuditActionName = "CREATE" | "UPDATE" | "ARCHIVE" | "DEACTIVATE" | "REVIEW" | "APPROVE" | "REJECT" | "PAYMENT" | "MOCK_EVENT" | "SEED" | "RESTORE";

type AuditInput = {
  action: AuditActionName;
  entityType: string;
  entityId: string;
  note: string;
  metadata?: Record<string, unknown>;
};

export function requireAuditNote(note: string, label = "This change"): string {
  const trimmed = note.trim();
  if (trimmed.length < 8) {
    throw new Error(`${label} requires a written reason of at least 8 characters.`);
  }
  return trimmed;
}

export async function createAuditLog(input: AuditInput) {
  if (!isDatabaseConfigured) return;

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      note: input.note,
      metadata: input.metadata ?? {},
    },
  });
}
