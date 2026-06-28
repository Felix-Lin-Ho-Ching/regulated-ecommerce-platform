"use server";

import { addInternalOrderNote, cancelOrderBeforeShipment, logOrderNotification, updateAdminOrderStatus } from "@/lib/admin/orders/service";
import type { AdminActionState } from "@/lib/admin/action-state";

export async function updateOrderStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const result = await updateAdminOrderStatus(String(formData.get("orderId") || ""), String(formData.get("status") || ""), String(formData.get("note") || ""));
  if (result.error) return { error: result.error };
  return { ok: true, success: "Order status updated." };
}

export async function cancelOrderAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const result = await cancelOrderBeforeShipment(String(formData.get("orderId") || ""), String(formData.get("note") || ""));
  if (result.error) return { error: result.error };
  return { ok: true, success: "Order cancelled, reservations released, and debug email logs created." };
}

export async function addInternalNoteAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const result = await addInternalOrderNote(String(formData.get("orderId") || ""), String(formData.get("note") || ""));
  if (result.error) return { error: result.error };
  return { ok: true, success: "Internal note saved." };
}

export async function logOrderNotificationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const result = await logOrderNotification(String(formData.get("orderId") || ""), String(formData.get("type") || "customer_confirmation") as any);
  if (result.error) return { error: result.error };
  return { ok: true, success: "Debug email log created." };
}
