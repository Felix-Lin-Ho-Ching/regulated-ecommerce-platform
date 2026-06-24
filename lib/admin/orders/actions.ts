"use server";

import { cancelOrderBeforeShipment, updateAdminOrderStatus } from "@/lib/admin/orders/service";
import type { AdminActionState } from "@/lib/admin/action-state";

export async function updateOrderStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "");
  const result = await updateAdminOrderStatus(orderId, status, note);
  if (result.error) return { error: result.error };
  return { ok: true, success: "Order status updated." };
}

export async function cancelOrderAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const result = await cancelOrderBeforeShipment(String(formData.get("orderId") || ""), String(formData.get("note") || ""));
  if (result.error) return { error: result.error };
  return { ok: true, success: "Order cancelled and reservation released." };
}
