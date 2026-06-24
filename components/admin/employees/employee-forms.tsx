"use client";

import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import type { AdminActionState } from "@/lib/admin/action-state";
import { createEmployeeAction, removeEmployeeAction, updateEmployeeAction } from "@/lib/admin/employees-actions";
import { employeeRoles } from "@/lib/admin/employees";

function StateAlert({ state }: { state: AdminActionState }) {
  return <>{state.error ? <AlertPanel title="Employee action failed" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title="Employee action complete" tone="success">{state.success}</AlertPanel> : null}</>;
}

export function CreateEmployeeForm() {
  const [state, action] = useActionState<AdminActionState, FormData>(createEmployeeAction, {});
  return <form action={action} className="card grid gap-3 p-5"><h2 className="font-black">Add employee</h2><StateAlert state={state}/><label className="text-sm font-bold">Name<input className="input mt-1" name="name" /></label><label className="text-sm font-bold">Email *<input className="input mt-1" name="email" type="email" /></label><label className="text-sm font-bold">Role *<select className="input mt-1" name="role">{employeeRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label><label className="text-sm font-bold">Temporary password *<input className="input mt-1" name="password" type="password" /></label><label className="flex gap-2 text-sm font-bold"><input name="enabled" type="checkbox" defaultChecked /> Enabled</label><button className="btn btn-primary">Create employee</button></form>;
}

export function EditEmployeeForm({ employee }: { employee: any }) {
  const [state, action] = useActionState<AdminActionState, FormData>(updateEmployeeAction, {});
  return <form action={action} className="grid min-w-80 gap-2"><input type="hidden" name="id" value={employee.id}/><StateAlert state={state}/><label className="text-xs font-bold">Name<input className="input mt-1" name="name" defaultValue={employee.name}/></label><label className="text-xs font-bold">Role<select className="input mt-1" name="role" defaultValue={employee.role.code}>{employeeRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label><label className="text-xs font-bold">New temporary password<input className="input mt-1" name="password" type="password" placeholder="Leave blank to keep current password"/></label><label className="flex gap-2 text-xs font-bold"><input name="enabled" type="checkbox" defaultChecked={employee.status === "ACTIVE"}/> Enabled</label><button className="btn btn-secondary text-sm">Save</button></form>;
}

export function RemoveEmployeeForm({ id }: { id: string }) {
  const [state, action] = useActionState<AdminActionState, FormData>(removeEmployeeAction, {});
  return <form action={action} className="mt-2"><input type="hidden" name="id" value={id}/>{state.error ? <AlertPanel title="Remove blocked" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title="Remove result" tone="success">{state.success}</AlertPanel> : null}<button className="btn btn-danger text-sm">Remove if safe</button></form>;
}
