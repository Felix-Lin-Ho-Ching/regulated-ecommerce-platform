import { VerificationTemplateForm } from "@/components/admin/compliance/verification-template-form";
import { AdminDataTable, AdminShell, AlertPanel, StatusBadge } from "@/components/ui";
import { getVerificationTemplates } from "@/lib/compliance/service";

export default async function VerificationTemplatesPage() {
  const templates = await getVerificationTemplates();

  return (
    <AdminShell title="Verification templates">
      <AlertPanel title="Verification requirement management" tone="info">
        Templates are database-driven and can be attached to state compliance rules. This phase keeps file uploads and external verification services mocked.
      </AlertPanel>
      <AdminDataTable
        columns={["Code", "Template", "Status", "Requirements", "Admin note"]}
        rows={templates.map((template) => [
          template.code,
          template.name,
          <StatusBadge key={template.id} tone={template.status === "ACTIVE" ? "success" : "warning"}>
            {template.status}
          </StatusBadge>,
          template.requirements.join(", "),
          template.description,
        ])}
      />
      <VerificationTemplateForm />
    </AdminShell>
  );
}
