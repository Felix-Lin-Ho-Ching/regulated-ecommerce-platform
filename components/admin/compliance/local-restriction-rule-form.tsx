"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import type { AdminActionState } from "@/lib/admin/action-state";
import { saveLocalRestrictionRuleAction } from "@/lib/compliance/actions";
import { ruleOutcomes } from "@/lib/compliance/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { restrictedClassOptions } from "@/lib/products/validation";

export function LocalRestrictionRuleForm({ products }: { products: AdminProductDetail[] }) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(saveLocalRestrictionRuleAction, {});

  return (
    <form action={formAction} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="font-black">Create ZIP/local shipping rule</h2>
        <p className="mt-1 text-sm text-slate-600">For ZIP overrides, choose ZIP, enter the ZIP code, and select No block / allowed or Blocked.</p>
      </div>
      {state.error ? <div className="md:col-span-2"><AlertPanel title="Local rule blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      {state.success ? <div className="md:col-span-2"><AlertPanel title="Local rule saved" tone="success">{state.success}</AlertPanel></div> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        State
        <input className="input" maxLength={2} name="localStateCode" defaultValue="UN" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Locality type
        <select className="input" name="localityType" defaultValue="ZIP">
          <option value="ZIP">ZIP</option>
          <option value="CITY">City</option>
          <option value="COUNTY">County</option>
          <option value="LOCALITY">Locality</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Locality name or ZIP
        <input className="input" name="localityName" placeholder="90210" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Restricted product category
        <select className="input" name="localRestrictedClass" defaultValue="STUN_GUN">
          {restrictedClassOptions.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Optional product override
        <select className="input" name="localProductId" defaultValue="">
          <option value="">All products in category</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Rule
        <select className="input" name="localOutcome" defaultValue="BLOCK">
          {ruleOutcomes.map((outcome) => <option key={outcome} value={outcome}>{outcome === "ALLOW" ? "No block / allowed" : "Blocked"}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Reason
        <textarea className="input min-h-24" name="localReason" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required audit note for this rule change *
        <textarea className="input min-h-24" name="localAuditNote" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">Save local rule</button>
    </form>
  );
}
