"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import type { AdminActionState } from "@/lib/admin/action-state";
import { saveComplianceRuleAction } from "@/lib/compliance/actions";
import { ruleOutcomes, ruleReviewStatuses } from "@/lib/compliance/validation";
import type { ComplianceRuleRow, VerificationTemplateRow } from "@/lib/compliance/service";
import type { AdminProductDetail } from "@/lib/products/service";
import { productCategories } from "@/lib/products/validation";

const exampleStates = ["CA", "HI", "IL", "UN"];

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
          Use examples like CA requiring ID verification, HI blocked, IL permit/FOID-style review, and UN manual review for unknown states. Seeded rules are not legal advice.
        </p>
      </div>
      {state.error ? <div className="md:col-span-2"><AlertPanel title="Compliance rule blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      {state.success ? <div className="md:col-span-2"><AlertPanel title="Compliance rule saved" tone="success">{state.success}</AlertPanel></div> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        State code *
        <input className="input" list="state-examples" maxLength={2} name="stateCode" defaultValue={rule?.stateCode ?? "UN"} />
        <datalist id="state-examples">
          {exampleStates.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Product category
        <select className="input" name="productCategory" defaultValue={rule?.productCategory ?? "knuckle_stun_device"}>
          {productCategories.map((category) => (
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
        Outcome
        <select className="input" name="outcome" defaultValue={rule?.outcome ?? "MANUAL_REVIEW"}>
          {ruleOutcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {outcome.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Review status
        <select className="input" name="reviewStatus" defaultValue={rule?.reviewStatus ?? "MANUAL_REVIEW"}>
          {ruleReviewStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Verification template
        <select className="input" name="verificationTemplateId" defaultValue={rule?.verificationTemplateId ?? templates[0]?.id}>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Effective from
        <input className="input" name="effectiveFrom" type="date" defaultValue={rule?.effectiveFrom} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Effective to
        <input className="input" name="effectiveTo" type="date" defaultValue={rule?.effectiveTo} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Rule reason
        <textarea className="input min-h-24" name="reason" defaultValue={rule?.reason} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required audit note for this rule change *
        <textarea className="input min-h-24" name="auditNote" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">
        Save compliance rule
      </button>
    </form>
  );
}
