import { AdminShell, AdminDataTable, FormField, AlertPanel } from "@/components/ui";
import { complianceRules } from "@/lib/mock-data";

export default function Rules() {
  return (
    <AdminShell title="Compliance rules">
      <AdminDataTable
        columns={["Rule", "State", "Category", "Outcome", "Coverage", "Note"]}
        rows={complianceRules.map((rule) => [
          rule.id,
          rule.state,
          rule.category,
          rule.outcome,
          rule.coverage,
          rule.note,
        ])}
      />
      <section className="card mt-4 p-5">
        <h2 className="font-black">Rule change note</h2>
        <FormField label="Required change note" value="Updated after counsel review." />
        <AlertPanel title="No legal automation" tone="info">
          This storefront shows workflow only; legal rule content is mock data.
        </AlertPanel>
      </section>
    </AdminShell>
  );
}
