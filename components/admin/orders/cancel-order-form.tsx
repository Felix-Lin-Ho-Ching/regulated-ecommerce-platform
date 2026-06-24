"use client";
import { useActionState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { cancelOrderAction } from "@/lib/admin/orders/actions";
import type { AdminActionState } from "@/lib/admin/action-state";
export function CancelOrderForm({ orderId }: { orderId: string }) { const [state, action] = useActionState<AdminActionState, FormData>(cancelOrderAction, {}); return <form action={action} className="card mt-4 grid gap-3 p-5"><h2 className="font-black">Cancel before shipment</h2><input type="hidden" name="orderId" value={orderId} />{state.error ? <AlertPanel title="Cancellation blocked" tone="danger">{state.error}</AlertPanel> : null}{state.success ? <AlertPanel title="Cancelled" tone="success">{state.success}</AlertPanel> : null}<textarea className="input min-h-24" name="note" placeholder="Required cancellation reason" /><button className="btn btn-secondary">Cancel order</button></form>; }
