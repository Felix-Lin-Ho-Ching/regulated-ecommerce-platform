import Link from "next/link";
import { AlertPanel } from "@/components/common/panels";
import { AdminShell, EmptyState } from "@/components/ui";
import { ProductDetail } from "@/components/store-products";
import { requireOwnerOrAdmin } from "@/lib/admin/authorization";
import { getAdminProductById } from "@/lib/products/service";

export default async function AdminProductPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwnerOrAdmin("/admin/products");
  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) {
    return <AdminShell title="Product preview"><EmptyState title="Product not found">This product could not be found.</EmptyState></AdminShell>;
  }
  return (
    <AdminShell title="Product preview" currentPath="/admin/products">
      <div className="mb-5">
        <AlertPanel title="Admin-only preview" tone="warning">
          You are previewing {product.status} product content. Draft and archived products remain unavailable on public product URLs. <Link className="font-black underline" href={`/admin/products/${product.id}`}>Back to editing</Link>
        </AlertPanel>
      </div>
      <ProductDetail product={product} />
    </AdminShell>
  );
}
