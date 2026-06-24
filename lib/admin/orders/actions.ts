"use server";

import { updateAdminOrderStatus } from "@/lib/admin/orders/service";
import type { AdminActionState } from "@/lib/admin/action-state";

export async function updateOrderStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "");
  const result = await updateAdminOrderStatus(orderId, status, note);
  if (result.error) return { error: result.error };
  return { ok: true, success: "Order status updated." };
}
