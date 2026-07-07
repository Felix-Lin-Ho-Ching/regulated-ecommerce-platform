"use server";
import { revalidatePath } from "next/cache";
import { requireOwnerOrAdminAction } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";
import { normalizeCarrierCode, validateTrackingUrlTemplate } from "@/lib/shipping/carriers";
import type { AdminActionState } from "@/lib/admin/action-state";

export async function saveShippingCarrierAction(_s: AdminActionState, fd: FormData): Promise<AdminActionState> {
  const auth = await requireOwnerOrAdminAction("/admin/shipping-carriers");
  if ("error" in auth) return auth;
  const session = auth.session!;
  const id = String(fd.get("id") || "").trim();
  const name = String(fd.get("name") || "").trim();
  const code = normalizeCarrierCode(String(fd.get("code") || ""));
  const trackingUrlTemplate = String(fd.get("trackingUrlTemplate") || "").trim();
  const enabled = fd.get("enabled") === "on";
  const sortOrder = Number(fd.get("sortOrder") || 0);
  if (!name) return { error: "Carrier name is required." };
  if (!code) return { error: "Carrier code is required." };
  if (!Number.isInteger(sortOrder)) return { error: "Sort order must be a whole number." };
  const templateError = validateTrackingUrlTemplate(trackingUrlTemplate);
  if (templateError) return { error: templateError };
  try {
    if (id) await (prisma as any).shippingCarrier.update({ where: { id }, data: { name, code, trackingUrlTemplate, enabled, sortOrder } });
    else await (prisma as any).shippingCarrier.create({ data: { name, code, trackingUrlTemplate, enabled, sortOrder } });
    await (prisma as any).auditLog.create({ data: { actorAdminId: session.demo ? null : session.adminId, action: id ? "UPDATE" : "CREATE", entityType: "ShippingCarrier", entityId: id || code, note: `Shipping carrier ${id ? "updated" : "created"}.`, metadata: { actingUserEmail: session.email, actingRole: session.role, code, enabled } } });
  } catch (error: any) {
    return { error: error?.code === "P2002" ? "Carrier code must be unique." : "Carrier could not be saved." };
  }
  revalidatePath("/admin/shipping-carriers");
  revalidatePath("/admin/fulfillment");
  return { success: "Shipping carrier saved." };
}

export async function disableShippingCarrierAction(fd: FormData): Promise<void> {
  const auth = await requireOwnerOrAdminAction("/admin/shipping-carriers");
  if ("error" in auth) return;
  const id = String(fd.get("id") || "").trim();
  if (id) await (prisma as any).shippingCarrier.update({ where: { id }, data: { enabled: false } });
  revalidatePath("/admin/shipping-carriers");
}
