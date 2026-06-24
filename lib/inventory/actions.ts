"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import type { AdminActionState } from "@/lib/admin/action-state";
import { adjustInventory } from "@/lib/inventory/service";

export async function adjustInventoryAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const inventoryValue = formData.get("inventoryId");
  const stockValue = formData.get("onHand");
  const reasonValue = formData.get("reason");
  const inventoryId = typeof inventoryValue === "string" ? inventoryValue : "";
  const stockText = typeof stockValue === "string" ? stockValue.trim() : "";
  const onHand = Number(stockText);

  if (!inventoryId) return { error: "Select an inventory record." };
  if (!/^\d+$/.test(stockText) || !Number.isSafeInteger(onHand) || onHand < 0) {
    return { error: "New on-hand stock count must be a non-negative whole number." };
  }

  const typedReason = typeof reasonValue === "string" ? reasonValue.trim() : "";
  const result = await adjustInventory(inventoryId, onHand, typedReason);
  if (!result) return { error: "Inventory record was not found." };

  await createAuditLog({ action: "UPDATE", entityType: "Inventory", entityId: inventoryId, note: result.reason, metadata: { onHand, previousOnHand: result.previousOnHand } });
  revalidatePath("/admin/inventory");
  return { ok: true, success: "Inventory adjustment saved." };
}
