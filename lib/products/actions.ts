"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { archiveProduct, createProduct, restoreProduct, updateProduct } from "@/lib/products/service";
import { parseProductForm } from "@/lib/products/validation";

export type ProductActionState = { error?: string };

const auditNoteError = "Reason must be at least 8 characters.";

function validateAuditNote(note: string, label: string): { error: string } | { note: string } {
  try {
    return { note: requireAuditNote(note, label) };
  } catch {
    return { error: auditNoteError };
  }
}

export async function createProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const input = parseProductForm(formData);
  const noteResult = validateAuditNote(input.auditNote, "Product creation");
  if ("error" in noteResult) return noteResult;
  const productId = await createProduct(input);

  await createAuditLog({
    action: "CREATE",
    entityType: "Product",
    entityId: productId,
    note: noteResult.note,
    metadata: { restricted: input.restricted, status: input.status },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}`);
}

export async function updateProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const input = parseProductForm(formData);
  if (!input.id) return { error: "Missing product id." };
  const noteResult = validateAuditNote(input.auditNote, "Product update");
  if ("error" in noteResult) return noteResult;

  await updateProduct(input);
  await createAuditLog({
    action: "UPDATE",
    entityType: "Product",
    entityId: input.id,
    note: noteResult.note,
    metadata: { restricted: input.restricted, status: input.status },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.id}`);
  return {};
}

export async function archiveProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const idValue = formData.get("id");
  const noteValue = formData.get("archiveNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateAuditNote(typeof noteValue === "string" ? noteValue : "", "Product archive");
  if ("error" in noteResult) return noteResult;
  if (!id) return { error: "Missing product id." };

  await archiveProduct(id);
  await createAuditLog({ action: "ARCHIVE", entityType: "Product", entityId: id, note: noteResult.note });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect("/admin/products");
}

export async function restoreProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const idValue = formData.get("id");
  const noteValue = formData.get("restoreNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateAuditNote(typeof noteValue === "string" ? noteValue : "", "Product restore");
  if ("error" in noteResult) return noteResult;
  if (!id) return { error: "Missing product id." };

  await restoreProduct(id);
  await createAuditLog({ action: "RESTORE", entityType: "Product", entityId: id, note: noteResult.note });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect(`/admin/products/${id}`);
}
