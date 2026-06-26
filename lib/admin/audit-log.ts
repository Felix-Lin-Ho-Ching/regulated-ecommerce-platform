import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type AdminAuditLogRow = {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  note: string;
};

export async function getAdminAuditLogs(): Promise<{ available: boolean; rows: AdminAuditLogRow[] }> {
  if (!isDatabaseConfigured) return { available: false, rows: [] };

  try {
    const rows = await prisma.auditLog.findMany({
      include: { actorAdmin: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      available: true,
      rows: rows.map((row: any) => ({
        id: row.id,
        time: row.createdAt.toISOString(),
        actor: row.actorAdmin?.name || row.actorAdmin?.email || "System",
        action: row.action,
        target: `${row.entityType}:${row.entityId}`,
        note: row.metadata ? `${row.note} ${JSON.stringify(row.metadata)}` : row.note,
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}
