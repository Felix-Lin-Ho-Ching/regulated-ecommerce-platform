"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit/audit-service";
import {
  optionalAuditNote,
  reasonRequiredMessage,
  validateManualReason,
  type AdminActionState,
} from "@/lib/admin/action-state";
import {
  archiveProduct,
  createProduct,
  getAdminProductById,
  restoreProduct,
  updateProduct,
  inlineCategoryDuplicateMessage,
} from "@/lib/products/service";
import {
  parseProductForm,
  ProductFormValidationError,
  type ProductMediaType,
} from "@/lib/products/validation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MEDIA_TYPES,
  ProductMediaStorageError,
  storeProductMediaFile,
} from "@/lib/storage/product-media-storage";

function actionIntent(formData: FormData): string | undefined {
  const intent = formData.get("intent");
  return typeof intent === "string" ? intent : undefined;
}

function productSaveError(error: unknown, intent?: string): ProductActionState {
  const message =
    error instanceof Error ? error.message : "Product could not be saved.";
  if (message.includes("SKU generation failed"))
    return {
      error: "SKU generation failed. Enter a custom SKU and try again.",
      intent,
    };
  if (message === inlineCategoryDuplicateMessage)
    return { error: inlineCategoryDuplicateMessage, intent };
  if (message.includes("Unique constraint") || message.includes("P2002"))
    return {
      error:
        "Product could not be saved: slug must be unique and SKU must be unique.",
      intent,
    };
  return { error: message, intent };
}

function productAuditNote(
  auditNote: string,
  fallback: string,
  newCategoryName?: string,
): string {
  const note = optionalAuditNote(auditNote, fallback);
  return newCategoryName
    ? `${note} Category "${newCategoryName}" was created from the product form.`
    : note;
}

export type ProductActionState = AdminActionState;

async function saveProductMediaUpload(
  file: File,
  type: ProductMediaType,
  role: "media" | "thumbnail",
): Promise<string> {
  try {
    const allowedTypes = PRODUCT_IMAGE_MEDIA_TYPES;
    const maxBytes = PRODUCT_IMAGE_MAX_BYTES;
    return (await storeProductMediaFile(file, { allowedTypes, maxBytes }))
      .publicPath;
  } catch (error) {
    if (error instanceof ProductMediaStorageError) throw error;
    throw new Error("Upload failed. Try again or use a media URL.");
  }
}

const riskyStatuses = new Set(["ARCHIVED", "RESTRICTED_REVIEW"]);

async function requireProductEditor() {
  const session = await requireAdminSession("/admin/products");
  if (!["OWNER", "ADMIN"].includes(session.role))
    throw new Error("Only OWNER and ADMIN users can edit products.");
}

export async function createProductAction(
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireProductEditor();
  let input;
  try {
    input = await parseProductForm(formData, saveProductMediaUpload);
  } catch (error) {
    if (error instanceof ProductFormValidationError)
      return { error: error.message, intent: actionIntent(formData) };
    throw error;
  }
  const note = productAuditNote(
    input.auditNote,
    "Owner created product.",
    input.newCategoryName,
  );
  let productId: string;
  try {
    productId = await createProduct(input);
  } catch (error) {
    return productSaveError(error, actionIntent(formData));
  }

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

export async function updateProductAction(
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireProductEditor();
  let input;
  try {
    input = await parseProductForm(formData, saveProductMediaUpload);
  } catch (error) {
    if (error instanceof ProductFormValidationError)
      return { error: error.message, intent: actionIntent(formData) };
    throw error;
  }
  if (!input.id)
    return { error: "Missing product id.", intent: actionIntent(formData) };

  const current = await getAdminProductById(input.id);
  if (!current)
    return { error: "Product was not found.", intent: actionIntent(formData) };

  const requiresManualReason =
    current.restricted !== input.restricted ||
    (current.status !== input.status && riskyStatuses.has(input.status));
  const noteResult = requiresManualReason
    ? validateManualReason(input.auditNote)
    : {
        note: productAuditNote(
          input.auditNote,
          "Owner updated product details.",
          input.newCategoryName,
        ),
      };
  if ("error" in noteResult) return noteResult;

  try {
    await updateProduct(input);
  } catch (error) {
    return productSaveError(error, actionIntent(formData));
  }
  await createAuditLog({
    action: "UPDATE",
    entityType: "Product",
    entityId: input.id,
    note: noteResult.note,
    metadata: { restricted: input.restricted, status: input.status },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.id}`);
  redirect(`/admin/products/${input.id}?saved=1`);
}

export async function archiveProductAction(
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireProductEditor();
  const idValue = formData.get("id");
  const noteValue = formData.get("archiveNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateManualReason(
    typeof noteValue === "string" ? noteValue : "",
  );
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  if (!id) return { error: "Missing product id." };

  const archived = await archiveProduct(id);
  if (!archived) return { error: "Product was not found." };
  await createAuditLog({
    action: "ARCHIVE",
    entityType: "Product",
    entityId: id,
    note: noteResult.note,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect("/admin/products");
}

export async function restoreProductAction(
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireProductEditor();
  const idValue = formData.get("id");
  const noteValue = formData.get("restoreNote");
  const id = typeof idValue === "string" ? idValue : "";
  const noteResult = validateManualReason(
    typeof noteValue === "string" ? noteValue : "",
  );
  if ("error" in noteResult) return { error: reasonRequiredMessage };
  if (!id) return { error: "Missing product id." };

  const restored = await restoreProduct(id);
  if (!restored) return { error: "Product was not found." };
  await createAuditLog({
    action: "RESTORE",
    entityType: "Product",
    entityId: id,
    note: noteResult.note,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect(`/admin/products/${id}`);
}
