import { notFound } from "next/navigation";
import { ArchiveProductForm } from "@/components/admin/products/archive-product-form";
import { ProductForm } from "@/components/admin/products/product-form";
import { AdminShell, SectionHeader, StatusBadge } from "@/components/ui";
import { getAdminProductById } from "@/lib/products/service";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) notFound();

  return (
    <AdminShell title="Edit product">
      <SectionHeader eyebrow="Product admin" title={product.name}>
        Restricted status, inventory attachment, and feature rows are visible before activation.
      </SectionHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone={product.restricted ? "warning" : "success"}>
          {product.restricted ? "Restricted" : "Unrestricted"}
        </StatusBadge>
        <StatusBadge tone={product.hasInventory ? "success" : "danger"}>
          {product.hasInventory ? "Inventory attached" : "Inventory missing"}
        </StatusBadge>
      </div>
      <ProductForm product={product} />
      <div className="mt-6">
        <ArchiveProductForm productId={product.id} />
      </div>
    </AdminShell>
  );
}
