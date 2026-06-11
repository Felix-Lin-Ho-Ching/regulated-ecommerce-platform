import Link from "next/link";
import { AppShell, SectionHeader } from "@/components/ui";
import { ProductGrid } from "@/components/store/product-components";
import { getCatalogProducts } from "@/lib/db/catalog";

export default async function Products() {
  const products = await getCatalogProducts();

  return (
    <AppShell>
      <SectionHeader eyebrow="Shop" title="Stun Fry products">
        Browse safety products with clear pricing, stock status, and restricted-product eligibility notices.
      </SectionHeader>
      <div className="grid gap-5 md:grid-cols-4">
        <aside className="card p-5">
          <h2 className="font-black">Filter products</h2>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" />
            Show restricted products
          </label>
          <label className="mt-4 block text-sm font-bold">
            Category
            <select className="input mt-2">
              <option>All categories</option>
              <option>Personal alarms</option>
              <option>Training kits</option>
              <option>Restricted devices</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-bold">
            State preview
            <select className="input mt-2">
              <option>TX</option>
              <option>CA</option>
              <option>NY</option>
            </select>
          </label>
          <Link className="btn btn-secondary mt-5 w-full" href="/restricted-products-policy">
            Restricted policy
          </Link>
        </aside>
        <ProductGrid products={products} />
      </div>
    </AppShell>
  );
}
