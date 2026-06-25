import Link from "next/link";
import {
  AppShell,
  ProductCard,
  SectionHeader,
} from "@/components/store-products";
import { AlertPanel } from "@/components/common/panels";
import { getCatalogProducts, storefrontCategories } from "@/lib/db/catalog";

type ProductSearchParams = {
  added?: string;
  cartError?: string;
  cartNotice?: string;
  available?: string;
  q?: string;
  category?: string;
};

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category?.trim() ?? "all";
  const products = await getCatalogProducts({ q, category });
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (category && category !== "all") returnParams.set("category", category);
  const returnTo = returnParams.toString() ? `/products?${returnParams}` : "/products";

  return (
    <AppShell>
      <SectionHeader eyebrow="Shop" title="Self-defense products">
        Browse everyday safety products, compare stock and pricing, and add
        items to your cart.
      </SectionHeader>
      {sp.added ? (
        <div className="mb-5">
          <AlertPanel title="Added to cart" tone="success">
            Your item was added. {" "}
            <Link className="font-black underline" href="/cart">
              View cart
            </Link>
          </AlertPanel>
        </div>
      ) : null}
      {sp.cartNotice === "adjusted" ? (
        <div className="mb-5">
          <AlertPanel title="Quantity adjusted" tone="warning">
            Quantity adjusted to available stock{sp.available ? ` (${sp.available}).` : "."}
          </AlertPanel>
        </div>
      ) : null}
      {sp.cartError ? (
        <div className="mb-5">
          <AlertPanel title="Cart update needed" tone="warning">
            {sp.cartError === "out-of-stock" ? "Item is out of stock." : sp.cartError === "not-found" ? "Item could not be found." : "Cart could not be updated."}
          </AlertPanel>
        </div>
      ) : null}
      <form
        action="/products"
        method="get"
        className="mb-6 grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto_auto] md:items-end"
      >
        <label className="block text-sm font-bold">
          Search products
          <input
            className="input mt-2"
            name="q"
            placeholder="Search by product or category"
            type="search"
            defaultValue={q}
          />
        </label>
        <label className="block text-sm font-bold">
          Category
          <select
            className="input mt-2"
            name="category"
            defaultValue={category || "all"}
          >
            {storefrontCategories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-primary" type="submit">
          Search
        </button>
        <Link className="btn-secondary text-center" href="/products">
          Clear
        </Link>
      </form>
      {products.length > 0 ? (
        <ProductCard.Grid products={products} returnTo={returnTo} />
      ) : (
        <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            No products found
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Try a different search or category.
          </p>
          <Link
            className="mt-5 inline-flex font-black text-teal-900 underline"
            href="/products"
          >
            Clear filters
          </Link>
        </section>
      )}
    </AppShell>
  );
}
