import Link from "next/link";
import { AdminDataTable, AdminShell, RestrictedProductBadge, StatusBadge } from "@/components/ui";
import { getAdminProducts, type AdminProductListFilter } from "@/lib/products/service";
import { money } from "@/lib/utils";

const filters: Array<{ label: string; value: AdminProductListFilter }> = [
  { label: "Active products", value: "active" },
  { label: "Archived products", value: "archived" },
  { label: "All products", value: "all" },
];

export default async function ProductsAdminPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = filters.some((item) => item.value === params?.filter) ? (params?.filter as AdminProductListFilter) : "active";
  const products = await getAdminProducts(filter);

  return (
    <AdminShell title="Products" currentPath="/admin/products">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Link className={`btn ${filter === item.value ? "btn-primary" : "btn-secondary"}`} href={`/admin/products?filter=${item.value}`} key={item.value}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href="/admin/products/new">
          New product
        </Link>
      </div>
      <AdminDataTable
        columns={["Product", "Category", "Status", "Restricted", "Inventory", "SKU", "Price", "Action"]}
        rows={products.map((product) => [
          product.name,
          product.category,
          <StatusBadge key={`${product.id}-status`} tone={product.archivedAt ? "danger" : product.status === "ACTIVE" ? "success" : "warning"}>
            {product.archivedAt ? "ARCHIVED" : product.status}
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
