"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit/audit-service";
import { optionalAuditNote, reasonRequiredMessage, validateManualReason, type AdminActionState } from "@/lib/admin/action-state";
import { archiveProduct, createProduct, getAdminProductById, restoreProduct, updateProduct } from "@/lib/products/service";
import { parseProductForm, ProductFormValidationError, type ProductMediaType } from "@/lib/products/validation";
import { IMAGE_MEDIA_TYPES, LocalMediaUploadError, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, saveLocalMediaUpload, VIDEO_MEDIA_TYPES } from "@/lib/media/local-upload";

export type ProductActionState = AdminActionState;

async function saveProductMediaUpload(file: File, type: ProductMediaType, role: "media" | "thumbnail"): Promise<string> {
  try {
    const allowedTypes = role === "thumbnail" || type === "IMAGE" ? [...IMAGE_MEDIA_TYPES] : [...VIDEO_MEDIA_TYPES];
    const maxBytes = role === "thumbnail" || type === "IMAGE" ? MAX_IMAGE_UPLOAD_BYTES : MAX_VIDEO_UPLOAD_BYTES;
    return (await saveLocalMediaUpload(file, { folder: "products", allowedTypes, maxBytes })).publicPath;
  } catch (error) {
    if (error instanceof LocalMediaUploadError) throw error;
    throw new Error("Upload failed. Try again or use a media URL.");
  }
}

const riskyStatuses = new Set(["ARCHIVED", "RESTRICTED_REVIEW"]);

export async function createProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  let input;
  try {
    input = await parseProductForm(formData, saveProductMediaUpload);
  } catch (error) {
    if (error instanceof ProductFormValidationError) return { error: error.message };
    throw error;
  }
  const note = optionalAuditNote(input.auditNote, "Owner created product.");
  const productId = await createProduct(input);

  await createAuditLog({ action: "CREATE", entityType: "Product", entityId: productId, note, metadata: { restricted: input.restricted, status: input.status } });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}`);
}

export async function updateProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  let input;
  try {
    input = await parseProductForm(formData, saveProductMediaUpload);
  } catch (error) {
    if (error instanceof ProductFormValidationError) return { error: error.message };
    throw error;
  }
  if (!input.id) return { error: "Missing product id." };

  const current = await getAdminProductById(input.id);
  if (!current) return { error: "Product was not found." };

  const requiresManualReason = current.restricted !== input.restricted || (current.status !== input.status && riskyStatuses.has(input.status));
  const noteResult = requiresManualReason ? validateManualReason(input.auditNote) : { note: optionalAuditNote(input.auditNote, "Owner updated product details.") };
  if ("error" in noteResult) return noteResult;

  await updateProduct(input);
  await createAuditLog({ action: "UPDATE", entityType: "Product", entityId: input.id, note: noteResult.note, metadata: { restricted: input.restricted, status: input.status } });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.id}`);
  return { ok: true, success: "Product saved." };
}

export async function archiveProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const idValue = formData.get("id");
  const noteValue = formData.get("archiveNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateManualReason(typeof noteValue === "string" ? noteValue : "");
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  if (!id) return { error: "Missing product id." };

  const archived = await archiveProduct(id);
  if (!archived) return { error: "Product was not found." };
  await createAuditLog({ action: "ARCHIVE", entityType: "Product", entityId: id, note: noteResult.note });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect("/admin/products");
}

export async function restoreProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const idValue = formData.get("id");
  const noteValue = formData.get("restoreNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateManualReason(typeof noteValue === "string" ? noteValue : "");
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  if (!id) return { error: "Missing product id." };

  const restored = await restoreProduct(id);
  if (!restored) return { error: "Product was not found." };
  await createAuditLog({ action: "RESTORE", entityType: "Product", entityId: id, note: noteResult.note });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect(`/admin/products/${id}`);
}
