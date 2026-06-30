import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type ProductCategoryInput = { id?: string; slug: string; name: string; description?: string; status: "ACTIVE" | "INACTIVE" | "ARCHIVED"; sortOrder: number; reassignToCategoryId?: string };
export type AdminProductCategory = ProductCategoryInput & { id: string; archivedAt: Date | null; productCount: number };

export async function getProductCategories(): Promise<AdminProductCategory[]> {
  if (!isDatabaseConfigured) return [];
  const rows = await prisma.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((row: any) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description ?? undefined, status: row.status, sortOrder: row.sortOrder, archivedAt: row.archivedAt, productCount: row._count.products }));
}

export async function getActiveProductCategories() {
  if (!isDatabaseConfigured) return [];
  return prisma.productCategory.findMany({ where: { status: "ACTIVE", archivedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function saveProductCategory(input: ProductCategoryInput) {
  if (!isDatabaseConfigured) return "mock-category";
  const data = { slug: input.slug, name: input.name, description: input.description || null, status: input.status, sortOrder: input.sortOrder, archivedAt: input.status === "ARCHIVED" ? new Date() : null };
  if (input.id) {
    await prisma.productCategory.update({ where: { id: input.id }, data });
    return input.id;
  }
  const row = await prisma.productCategory.create({ data });
  return row.id;
}

export async function archiveProductCategory(id: string, reassignToCategoryId?: string) {
  if (!isDatabaseConfigured) return;
  if (reassignToCategoryId) await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: reassignToCategoryId } });
  await prisma.productCategory.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
}

export async function deleteProductCategory(id: string, reassignToCategoryId?: string) {
  if (!isDatabaseConfigured) return;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0 && !reassignToCategoryId) throw new Error("Reassign products before deleting this category.");
  if (reassignToCategoryId) await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: reassignToCategoryId } });
  await prisma.productCategory.delete({ where: { id } });
}
