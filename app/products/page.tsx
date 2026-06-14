import Link from "next/link";
import { AppShell, ProductCard, SectionHeader } from "@/components/store-products";
import { AlertPanel } from "@/components/common/panels";
import { getCatalogProducts } from "@/lib/db/catalog";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const [products, sp] = await Promise.all([getCatalogProducts(), searchParams]);

  return (
    <AppShell>
      <SectionHeader eyebrow="Shop" title="Self-defense products">
        Browse our products, compare stock and pricing, and add items to your cart.
      </SectionHeader>
      {sp.added ? (
        <div className="mb-5">
          <AlertPanel title="Added to cart" tone="success">
            Your item was added. <Link className="font-black underline" href="/cart">View cart</Link>
          </AlertPanel>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <aside className="card p-4">
          <h2 className="font-black">Filters</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="block font-bold">
              Category
              <select className="input mt-1">
                <option>All products</option>
                <option>Self-defense devices</option>
                <option>Personal safety</option>
              </select>
            </label>
            <label className="block font-bold">
              Stock
              <select className="input mt-1">
                <option>All stock statuses</option>
                <option>In stock</option>
                <option>Out of stock</option>
              </select>
            </label>
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
