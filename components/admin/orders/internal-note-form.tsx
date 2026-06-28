"use client";
import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { addInternalNoteAction } from "@/lib/admin/orders/actions";
import type { AdminActionState } from "@/lib/admin/action-state";
export function InternalNoteForm({ orderId }: { orderId: string }) { const [state, action] = useActionState<AdminActionState, FormData>(addInternalNoteAction, {}); return <form action={action} className="card mt-4 grid gap-3 p-5"><h2 className="font-black">Internal admin note</h2><p className="text-sm text-slate-600">Notes are saved to the audit trail and are not customer-facing.</p><input type="hidden" name="orderId" value={orderId} />{state.error ? <AlertPanel title="Note blocked" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title="Note saved" tone="success">{state.success}</AlertPanel> : null}<textarea className="input min-h-24" name="note" placeholder="Customer asked to cancel, address needs confirmation, payment link sent manually..." /><button className="btn btn-primary">Add note</button></form>; }
