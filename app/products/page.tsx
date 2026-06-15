import Link from "next/link";
import { AppShell, ProductCard, SectionHeader } from "@/components/store-products";
import { AlertPanel } from "@/components/common/panels";
import { getCatalogProducts } from "@/lib/db/catalog";

export default async function Products({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const [products, sp] = await Promise.all([getCatalogProducts(), searchParams]);

  return (
    <AppShell>
      <SectionHeader eyebrow="Shop" title="Self-defense products">
        Browse everyday safety products, compare stock and pricing, and add items to your cart.
      </SectionHeader>
      {sp.added ? (
        <div className="mb-5">
          <AlertPanel title="Added to cart" tone="success">
            Your item was added. <Link className="font-black underline" href="/cart">View cart</Link>
          </AlertPanel>
        </div>
      ) : null}
      <section className="mb-6 grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="block text-sm font-bold">
          Search products
          <input className="input mt-2" placeholder="Search by product or category" type="search" />
        </label>
        <label className="block text-sm font-bold">
          Category
          <select className="input mt-2">
            <option>All products</option>
            <option>Self-defense devices</option>
            <option>Personal safety</option>
          </select>
        </label>
      </section>
      <ProductCard.Grid products={products} />
    </AppShell>
  );
}
