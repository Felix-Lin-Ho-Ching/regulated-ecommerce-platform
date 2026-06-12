"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { archiveProduct, createProduct, updateProduct } from "@/lib/products/service";
import { parseProductForm } from "@/lib/products/validation";

export async function createProductAction(formData: FormData) {
  const input = parseProductForm(formData);
  const note = requireAuditNote(input.auditNote, "Product creation");
  const productId = await createProduct(input);

  await createAuditLog({
    action: "CREATE",
    entityType: "Product",
    entityId: productId,
    note,
    metadata: { restricted: input.restricted, status: input.status },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}`);
}

export async function updateProductAction(formData: FormData) {
  const input = parseProductForm(formData);
  if (!input.id) throw new Error("Missing product id.");
  const note = requireAuditNote(input.auditNote, "Product update");

  await updateProduct(input);
  await createAuditLog({
    action: "UPDATE",
    entityType: "Product",
    entityId: input.id,
    note,
    metadata: { restricted: input.restricted, status: input.status },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.id}`);
}

export async function archiveProductAction(formData: FormData) {
  const idValue = formData.get("id");
  const noteValue = formData.get("archiveNote");
  const id = typeof idValue === "string" ? idValue : "";
  const note = requireAuditNote(typeof noteValue === "string" ? noteValue : "", "Product archive");

  if (!id) throw new Error("Missing product id.");

  await archiveProduct(id);
  await createAuditLog({ action: "ARCHIVE", entityType: "Product", entityId: id, note });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}
