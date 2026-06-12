import { AppShell } from "@/components/ui";
import { StorefrontHome } from "@/components/store/storefront";
import { getCatalogProducts } from "@/lib/db/catalog";
import { getStorefrontContent } from "@/lib/storefront-content/service";

export default async function Home() {
  const [products, storefrontContent] = await Promise.all([
    getCatalogProducts(),
    getStorefrontContent(),
  ]);

  return (
    <AppShell>
      <StorefrontHome content={storefrontContent} products={products} />
    </AppShell>
  );
}
