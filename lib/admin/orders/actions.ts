"use server";
import { redirect } from "next/navigation";
import { updateAdminOrderStatus } from "@/lib/admin/orders/service";

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "");
  await updateAdminOrderStatus(orderId, status, note);
  redirect(`/admin/orders/${formData.get("orderNumber")}`);
}
