"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import type { AdminActionState } from "@/lib/admin/action-state";
import { saveVerificationTemplateAction } from "@/lib/compliance/actions";
import { verificationRequirementTypes, verificationTemplateCodes } from "@/lib/compliance/validation";

export function VerificationTemplateForm() {
  const [state, formAction] = useActionState<AdminActionState, FormData>(saveVerificationTemplateAction, {});
  return (
    <form action={formAction} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="font-black">Manage verification template</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update one of the controlled template codes and define its requirement rows. External ID or document services remain mocked in Phase 2B.
        </p>
      </div>
      {state.error ? <div className="md:col-span-2"><AlertPanel title="Verification template blocked" tone="danger">{state.error}</AlertPanel></div> : null}
      {state.success ? <div className="md:col-span-2"><AlertPanel title="Verification template saved" tone="success">{state.success}</AlertPanel></div> : null}
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Template code *
        <select className="input" name="code" defaultValue="MANUAL_REVIEW_DEFAULT">
          {verificationTemplateCodes.map((code) => (
            <option key={code} value={code}>
              {code.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Status
        <select className="input" name="status" defaultValue="ACTIVE">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Name
        <input className="input" name="name" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Description
        <input className="input" name="description" />
      </label>
      <div className="grid gap-3 md:col-span-2">
        <h3 className="font-black">Requirement rows</h3>
        {[0, 1, 2, 3].map((index) => (
          <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-[1fr_2fr_auto]" key={index}>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Type
              <select className="input" name={`requirementType${index}`}>
                {verificationRequirementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Label
              <input className="input" name={`requirementLabel${index}`} />
            </label>
            <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-800">
              <input defaultChecked name={`requirementRequired${index}`} type="checkbox" />
              Required
            </label>
          </div>
        ))}
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Required audit note *
        <textarea className="input min-h-24" name="auditNote" />
      </label>
      <button className="btn btn-primary md:w-fit" type="submit">
        Save verification template
      </button>
    </form>
  );
}
