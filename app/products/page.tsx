import Link from "next/link";
import { AppShell, ProductCard, SectionHeader } from "@/components/store-products";
import { StatusBadge } from "@/components/ui";
import { getCatalogProducts } from "@/lib/db/catalog";

export default async function Products() {
  const products = await getCatalogProducts();

  return (
    <AppShell>
      <SectionHeader eyebrow="Shop" title="Self-defense products">
        Browse products with price, stock, and clear restricted-product availability guidance before checkout.
      </SectionHeader>
      <div className="grid gap-4 md:grid-cols-4">
        <aside className="card p-4">
          <h2 className="font-black">Filters</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" defaultChecked />
              Show restricted products
            </label>
            <label className="block font-bold">
              State preview
              <select className="input mt-1">
                <option>Texas</option>
                <option>California</option>
                <option>New York</option>
                <option>Illinois</option>
              </select>
            </label>
            <label className="block font-bold">
              Category
              <select className="input mt-1">
                <option>All products</option>
                <option>Restricted devices</option>
                <option>Personal safety</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone="warning">Compliance visible</StatusBadge>
            <StatusBadge tone="info">Availability preview</StatusBadge>
          </div>
          <Link className="btn btn-secondary mt-4 w-full" href="/restricted-products-policy">
            Restricted-product policy
          </Link>
        </aside>
        <ProductCard.Grid products={products} />
      </div>
    </AppShell>
  );
}
