import { AdminShell, AlertPanel, SectionHeader, StatusBadge } from "@/components/ui";
import { getReadinessChecks } from "@/lib/admin/readiness";

export default async function ReadinessPage() {
  const readiness = await getReadinessChecks();

  return (
    <AdminShell title="Readiness" currentPath="/admin/launch-gates">
      <SectionHeader eyebrow="Owner checklist" title="Readiness checks">
        Simple operational checks based on real database counts. This page is informational only.
      </SectionHeader>
      {!readiness.available ? (
        <AlertPanel title="Database unavailable" tone="warning">{readiness.message}</AlertPanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {readiness.checks.map((check) => (
            <section className="card p-5" key={check.label}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black">{check.label}</h2>
                <StatusBadge tone={check.ready ? "success" : "warning"}>
                  {check.ready ? "Ready" : "Needs attention"}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm text-slate-600">{check.detail}</p>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
