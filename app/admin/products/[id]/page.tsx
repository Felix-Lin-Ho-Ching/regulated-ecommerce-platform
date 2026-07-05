import Link from "next/link";
import { ArchiveProductForm, RestoreProductForm } from "@/components/admin/products/archive-product-form";
import { ProductForm } from "@/components/admin/products/product-form";
import { getProductCategories } from "@/lib/product-categories/service";
import { AlertPanel } from "@/components/common/panels";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { getAdminProductById } from "@/lib/products/service";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categoryRows] = await Promise.all([getAdminProductById(id), getProductCategories()]);
  const categories = categoryRows.map((category) => ({ ...category, archivedAt: category.archivedAt ? category.archivedAt.toISOString() : null }));

  if (!product) {
    return (
      <AdminShell title="Product not found">
        <EmptyState title="Product not found">
          This product could not be found. <Link className="font-bold text-teal-900 underline" href="/admin/products">Back to products</Link>
        </EmptyState>
      </AdminShell>
    );
  }

  const isArchived = Boolean(product.archivedAt);

  return (
    <AdminShell title="Edit product">
      <SectionHeader eyebrow="Product admin" title={product.name}>
        Restricted status, inventory attachment, and feature rows are visible before activation.
      </SectionHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {isArchived ? <StatusBadge tone="danger">Archived</StatusBadge> : null}
        <StatusBadge tone={product.restricted ? "warning" : "success"}>
          {product.restricted ? "Restricted" : "Unrestricted"}
        </StatusBadge>
        <StatusBadge tone={product.hasInventory ? "success" : "danger"}>
          {product.hasInventory ? "Inventory attached" : "Inventory missing"}
        </StatusBadge>
      </div>
      {isArchived ? (
        <div className="mb-6">
          <AlertPanel title="Archived" tone="warning">
            This product is archived and hidden from the storefront.
          </AlertPanel>
        </div>
      ) : null}
      <ProductForm product={product} categories={categories} />
      <div className="mt-6">
        {isArchived ? <RestoreProductForm productId={product.id} /> : <ArchiveProductForm productId={product.id} />}
      </div>
    </AdminShell>
  );
}
