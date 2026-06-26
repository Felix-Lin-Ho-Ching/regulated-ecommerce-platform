import { AdminDataTable, AdminShell, AlertPanel } from "@/components/ui";
import { getAdminAuditLogs } from "@/lib/admin/audit-log";

export default async function AuditLogPage() {
  const result = await getAdminAuditLogs();

  return (
    <AdminShell title="Audit log" currentPath="/admin/audit-log">
      {!result.available ? <AlertPanel title="Database unavailable" tone="warning">Audit log records could not be loaded.</AlertPanel> : null}
      {result.rows.length ? (
        <AdminDataTable
          columns={["Time", "Actor", "Action", "Target", "Note / metadata"]}
          rows={result.rows.map((row) => [row.time, row.actor, row.action, row.target, row.note])}
        />
      ) : (
        <p className="card p-5 text-sm text-slate-600">No audit events yet.</p>
      )}
    </AdminShell>
  );
}
