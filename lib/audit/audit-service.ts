import { prisma } from "@/lib/db/prisma";

type JsonPrimitive = string | number | boolean;

export type JsonInput =
  | JsonPrimitive
  | { [key: string]: JsonInput | null }
  | Array<JsonInput | null>;

export type AuditEvent = {
  actorAdminId?: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "ARCHIVE"
    | "DEACTIVATE"
    | "REVIEW"
    | "APPROVE"
    | "REJECT"
    | "PAYMENT"
    | "MOCK_EVENT"
    | "SEED";
  entityType: string;
  entityId: string;
  note: string;
  metadata?: JsonInput;
};

export async function recordAuditEvent(event: AuditEvent) {
  return prisma.auditLog.create({
    data: {
      actorAdminId: event.actorAdminId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      note: event.note,
      metadata: event.metadata,
    },
  });
}
