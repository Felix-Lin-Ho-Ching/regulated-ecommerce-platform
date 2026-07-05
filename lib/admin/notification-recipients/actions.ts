"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import type { AdminActionState } from "@/lib/admin/action-state";
import { requireOwnerOrAdminAction } from "@/lib/admin/authorization";

function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function bool(formData: FormData, name: string) { return formData.get(name) === "on"; }

export async function saveNotificationRecipientAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/notification-recipients");
  if ("error" in auth) return auth;
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const id = String(formData.get("id") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  const duplicate = await prisma.notificationRecipient.findUnique({ where: { email } });
  if (duplicate && duplicate.id !== id) return { error: "A recipient with this email already exists." };
  const data = { email, name: String(formData.get("name") || "").trim() || null, role: String(formData.get("role") || "").trim() || null, orderAlerts: bool(formData, "orderAlerts"), shippingAlerts: bool(formData, "shippingAlerts"), enabled: bool(formData, "enabled") };
  if (id) await prisma.notificationRecipient.update({ where: { id }, data });
  else await prisma.notificationRecipient.create({ data });
  revalidatePath("/admin/notification-recipients");
  return { ok: true, success: "Notification recipient saved." };
}

export async function deleteNotificationRecipientAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/notification-recipients");
  if ("error" in auth) return auth;
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing recipient id." };
  await prisma.notificationRecipient.delete({ where: { id } });
  revalidatePath("/admin/notification-recipients");
  return { ok: true, success: "Notification recipient removed." };
}
