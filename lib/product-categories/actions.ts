"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archiveProductCategory, deleteProductCategory, saveProductCategory } from "@/lib/product-categories/service";
import { requireOwnerOrAdmin } from "@/lib/admin/authorization";

function text(formData: FormData, key: string) { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function status(value: string) { return (["ACTIVE", "INACTIVE", "ARCHIVED"] as const).includes(value as never) ? value as "ACTIVE" | "INACTIVE" | "ARCHIVED" : "ACTIVE"; }

export async function saveProductCategoryAction(formData: FormData) {
  await requireOwnerOrAdmin("/admin/categories");
  const name = text(formData, "name");
  await saveProductCategory({ id: text(formData, "id") || undefined, name, slug: slugify(text(formData, "slug") || name), description: text(formData, "description") || undefined, status: status(text(formData, "status")), sortOrder: Number.parseInt(text(formData, "sortOrder"), 10) || 0 });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect("/admin/categories");
}

export async function archiveProductCategoryAction(formData: FormData) {
  await requireOwnerOrAdmin("/admin/categories");
  await archiveProductCategory(text(formData, "id"), text(formData, "reassignToCategoryId") || undefined);
  revalidatePath("/admin/categories");
}

export async function deleteProductCategoryAction(formData: FormData) {
  await requireOwnerOrAdmin("/admin/categories");
  await deleteProductCategory(text(formData, "id"), text(formData, "reassignToCategoryId") || undefined);
  revalidatePath("/admin/categories");
}
