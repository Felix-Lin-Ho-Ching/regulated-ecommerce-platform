"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { adjustInventory } from "@/lib/inventory/service";

export async function adjustInventoryAction(formData: FormData) {
  const inventoryValue = formData.get("inventoryId");
  const stockValue = formData.get("onHand");
  const reasonValue = formData.get("reason");
  const inventoryId = typeof inventoryValue === "string" ? inventoryValue : "";
  const onHand = typeof stockValue === "string" ? Number.parseInt(stockValue, 10) : Number.NaN;
  const reason = requireAuditNote(typeof reasonValue === "string" ? reasonValue : "", "Stock adjustment");

  if (!inventoryId || !Number.isFinite(onHand) || onHand < 0) {
    throw new Error("A valid inventory record and non-negative stock count are required.");
  }

  await adjustInventory(inventoryId, onHand, reason);
  await createAuditLog({ action: "UPDATE", entityType: "Inventory", entityId: inventoryId, note: reason, metadata: { onHand } });
  revalidatePath("/admin/inventory");
}
