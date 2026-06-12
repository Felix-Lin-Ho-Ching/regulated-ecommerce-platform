import Link from "next/link";
import { AdminDataTable, AdminShell, RestrictedProductBadge, StatusBadge } from "@/components/ui";
import { getAdminProducts } from "@/lib/products/service";
import { money } from "@/lib/utils";

export default async function ProductsAdminPage() {
  const products = await getAdminProducts();

  return (
    <AdminShell title="Products">
      <div className="mb-4 flex justify-end">
        <Link className="btn btn-primary" href="/admin/products/new">
          New product
        </Link>
      </div>
      <AdminDataTable
        columns={["Product", "Category", "Status", "Restricted", "Inventory", "SKU", "Price", "Action"]}
        rows={products.map((product) => [
          product.name,
          product.category,
          <StatusBadge key={`${product.id}-status`} tone={product.status === "ACTIVE" ? "success" : "warning"}>
            {product.status}
          </StatusBadge>,
          product.restricted ? <RestrictedProductBadge key={`${product.id}-restricted`} /> : "Unrestricted",
          product.hasInventory ? "Attached" : "Missing",
          product.sku,
          money(product.price),
          <Link key={product.id} href={`/admin/products/${product.id}`}>
            Edit
          </Link>,
        ])}
      />
    </AdminShell>
  );
}
