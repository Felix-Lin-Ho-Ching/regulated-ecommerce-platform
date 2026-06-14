import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { AlertPanel } from "@/components/common/panels";
import { ProductDetail } from "@/components/store-products";
import { getCatalogProductBySlug } from "@/lib/db/catalog";
import Link from "next/link";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ added?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const product = await getCatalogProductBySlug(slug);

  if (!product) notFound();

  return (
    <AppShell>
      {sp.added ? (
        <div className="mb-5">
          <AlertPanel title="Added to cart" tone="success">
            Your item was added. <Link className="font-black underline" href="/cart">View cart</Link>
          </AlertPanel>
        </div>
      ) : null}
      <ProductDetail product={product} />
    </AppShell>
  );
}
