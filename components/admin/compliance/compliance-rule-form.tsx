"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import type { AdminActionState } from "@/lib/admin/action-state";
import { saveComplianceRuleAction } from "@/lib/compliance/actions";
import { ruleOutcomes } from "@/lib/compliance/validation";
import type { ComplianceRuleRow, VerificationTemplateRow } from "@/lib/compliance/service";
import type { AdminProductDetail } from "@/lib/products/service";
import { restrictedClassOptions } from "@/lib/products/validation";
import { usStateAndDcCodes } from "@/lib/compliance/restricted-state-rules";

export function ComplianceRuleForm({
  products,
  templates,
  rule,
}: {
  products: AdminProductDetail[];
  templates: VerificationTemplateRow[];
  rule?: ComplianceRuleRow;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(saveComplianceRuleAction, {});
  return (
    <form action={formAction} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      {rule ? <input name="id" type="hidden" value={rule.id} /> : null}
      <div className="md:col-span-2">
        <h2 className="font-black">Create or update restricted-product state rule</h2>
        <p className="mt-1 text-sm text-slate-600">
Use this page to block or allow restricted products by shipping state and local/ZIP rule. Unknown restricted destinations should fail closed.
        </p>
      </div>
      {state.error ? <div className="md:col-span-2"><AlertPanel title="Restricted rule blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      {state.success ? <div className="md:col-span-2"><AlertPanel title="Restricted rule saved" tone="success">{state.success}</AlertPanel></div> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        State
        <select className="input" name="stateCode" defaultValue={rule?.stateCode ?? "CA"}>
          {usStateAndDcCodes.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Restricted product category
        <select className="input" name="restrictedClass" defaultValue={rule?.restrictedClass ?? "STUN_GUN"}>
          {restrictedClassOptions.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Optional product override
        <select className="input" name="productId" defaultValue={rule?.productId ?? ""}>
          <option value="">All products in category</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Rule
        <select className="input" name="outcome" defaultValue={rule?.outcome === "ALLOW" ? "ALLOW" : "BLOCK"}>
          {ruleOutcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {outcome === "ALLOW" ? "No block / allowed" : "Blocked"}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="reviewStatus" value={rule?.reviewStatus ?? "COUNSEL_REVIEW_REQUIRED"} />
      <input type="hidden" name="verificationTemplateId" value={rule?.verificationTemplateId ?? templates[0]?.id ?? ""} />
      <input type="hidden" name="effectiveFrom" value={rule?.effectiveFrom ?? ""} />
      <input type="hidden" name="effectiveTo" value={rule?.effectiveTo ?? ""} />
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Rule reason
        <textarea className="input min-h-24" name="reason" defaultValue={rule?.reason} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required legal/source note for ALLOW rules
        <textarea className="input min-h-24" name="legalSourceNote" defaultValue={rule?.legalSourceNote} placeholder="Citation, counsel summary, or official source supporting an ALLOW change." />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required audit note for this rule change *
        <textarea className="input min-h-24" name="auditNote" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">
        Save restricted rule
      </button>
    </form>
  );
}
