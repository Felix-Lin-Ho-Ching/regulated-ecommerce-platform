import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { ProductDetail } from "@/components/store-products";
import { getCatalogProductBySlug } from "@/lib/db/catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) notFound();

  return (
    <AppShell>
      <ProductDetail product={product} />
    </AppShell>
  );
}
