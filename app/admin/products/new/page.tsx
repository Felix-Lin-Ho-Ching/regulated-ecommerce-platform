import { ProductForm } from "@/components/admin/products/product-form";
import { getProductCategories } from "@/lib/product-categories/service";
import { AdminShell, SectionHeader } from "@/components/ui";

export default async function NewProductPage() {
  const categoryRows = await getProductCategories();
  const categories = categoryRows.map((category) => ({ ...category, archivedAt: category.archivedAt ? category.archivedAt.toISOString() : null }));
  return (
    <AdminShell title="New product">
      <SectionHeader eyebrow="Product admin" title="Create owner-managed product">
        Add product details, a default SKU, price, restricted status, and compliance-relevant feature rows.
      </SectionHeader>
      <ProductForm categories={categories} />
    </AdminShell>
  );
}
