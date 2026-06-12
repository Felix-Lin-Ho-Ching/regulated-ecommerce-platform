"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { STOREFRONT_SETTINGS_KEY } from "@/lib/storefront-content/defaults";
import { upsertStorefrontContent } from "@/lib/storefront-content/service";
import { parseStorefrontContentForm } from "@/lib/storefront-content/validation";

export async function saveStorefrontContentAction(formData: FormData) {
  const content = parseStorefrontContentForm(formData);
  const noteValue = formData.get("auditNote");
  const note = requireAuditNote(typeof noteValue === "string" ? noteValue : "", "Storefront content update");

  await upsertStorefrontContent(content);
  await createAuditLog({
    action: "UPDATE",
    entityType: "StorefrontSettings",
    entityId: STOREFRONT_SETTINGS_KEY,
    note,
    metadata: { fields: Object.keys(content) },
  });

  revalidatePath("/");
  revalidatePath("/admin/storefront");
}
