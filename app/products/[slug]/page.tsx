import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { ProductDetail } from "@/components/store-products";
import { getCatalogProductBySlug } from "@/lib/db/catalog";
import { getStorefrontContent } from "@/lib/storefront-content/service";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, content] = await Promise.all([getCatalogProductBySlug(slug), getStorefrontContent()]);

  if (!product) notFound();

  return (
    <AppShell>
      <ProductDetail content={content} product={product} />
    </AppShell>
  );
}
