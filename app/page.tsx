import { AppShell } from "@/components/ui";
import { StorefrontHome } from "@/components/store/storefront";
import { getCatalogProducts } from "@/lib/db/catalog";
import { getStorefrontContent } from "@/lib/storefront-content/service";
import { getHomepageHeroMedia } from "@/lib/storefront/homepage-media";

export default async function Home() {
  const [products, storefrontContent, homepageMedia] = await Promise.all([
    getCatalogProducts(),
    getStorefrontContent(),
    getHomepageHeroMedia(),
  ]);

  return (
    <AppShell>
      <StorefrontHome content={storefrontContent} products={products} homepageMedia={homepageMedia} />
    </AppShell>
  );
}
