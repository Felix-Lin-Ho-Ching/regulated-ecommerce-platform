import { ComplianceRuleForm } from "@/components/admin/compliance/compliance-rule-form";
import { LocalRestrictionRuleForm } from "@/components/admin/compliance/local-restriction-rule-form";
import { AdminDataTable, AdminShell, AlertPanel, StatusBadge } from "@/components/ui";
import { getComplianceRules, getLocalRestrictionRules, getVerificationTemplates } from "@/lib/compliance/service";
import { getAdminProducts } from "@/lib/products/service";

export default async function ComplianceRulesPage() {
  const [rules, localRules, templates, products] = await Promise.all([
    getComplianceRules(),
    getLocalRestrictionRules(),
    getVerificationTemplates(),
    getAdminProducts(),
  ]);

  return (
    <AdminShell title="Restricted shipping rules" currentPath="/admin/compliance-rules">
      <AlertPanel title="Restricted product destination rules" tone="warning">
        Use this page to block or allow restricted products by shipping state and local/ZIP rule. Unknown restricted destinations should fail closed.
      </AlertPanel>
      <AdminDataTable
        columns={["State", "Restricted product category", "Product", "Rule", "Reason"]}
        rows={rules.map((rule) => [
          rule.stateCode,
          rule.productCategory,
          rule.productName,
          <StatusBadge key={`${rule.id}-outcome`} tone={rule.outcome === "BLOCK" ? "danger" : rule.outcome === "ALLOW" ? "success" : "warning"}>
            {rule.outcome}
          </StatusBadge>,
          rule.reason,
        ])}
      />
      <ComplianceRuleForm products={products} templates={templates} />
      <h2 className="mt-8 text-xl font-black">Shipping ZIP/local blocks</h2>
      {localRules.length ? (
        <AdminDataTable
          columns={["State", "Locality type", "Locality name / ZIP", "Category", "Product", "Rule", "Reason"]}
          rows={localRules.map((rule) => [
            rule.stateCode,
            rule.localityType,
            rule.localityName,
            rule.productCategory,
            rule.productName,
            <StatusBadge key={`${rule.id}-local-outcome`} tone={rule.outcome === "BLOCK" ? "danger" : rule.outcome === "ALLOW" ? "success" : "warning"}>{rule.outcome}</StatusBadge>,
            rule.reason,
          ])}
        />
      ) : (
        <p className="card p-5 text-sm text-slate-600">No ZIP/local restriction rules yet.</p>
      )}
      <LocalRestrictionRuleForm products={products} />
    </AdminShell>
  );
}
