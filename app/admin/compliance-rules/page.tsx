import { ComplianceRuleForm } from "@/components/admin/compliance/compliance-rule-form";
import { AdminDataTable, AdminShell, AlertPanel, StatusBadge } from "@/components/ui";
import { getComplianceRules, getVerificationTemplates } from "@/lib/compliance/service";
import { getAdminProducts } from "@/lib/products/service";

export default async function ComplianceRulesPage() {
  const [rules, templates, products] = await Promise.all([
    getComplianceRules(),
    getVerificationTemplates(),
    getAdminProducts(),
  ]);

  return (
    <AdminShell title="Compliance rules">
      <AlertPanel title="Database-driven rules, not legal advice" tone="warning">
        Missing or unreviewed restricted-product rules must remain MANUAL_REVIEW. Owners should treat seeded examples as workflow defaults, not final legal advice.
      </AlertPanel>
      <AdminDataTable
        columns={["State", "Category", "Product", "Outcome", "Review", "Template", "Reason"]}
        rows={rules.map((rule) => [
          rule.stateCode,
          rule.productCategory,
          rule.productName,
          <StatusBadge key={`${rule.id}-outcome`} tone={rule.outcome === "BLOCK" ? "danger" : rule.outcome === "ALLOW" ? "success" : "warning"}>
            {rule.outcome}
          </StatusBadge>,
          rule.reviewStatus,
          rule.verificationTemplateName,
          rule.reason,
        ])}
      />
      <ComplianceRuleForm products={products} templates={templates} />
    </AdminShell>
  );
}
