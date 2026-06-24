import { AppShell } from "@/components/ui";
import { StorefrontHome } from "@/components/store/storefront";
import { getCatalogProducts } from "@/lib/db/catalog";
import { getStorefrontContent } from "@/lib/storefront-content/service";
import { getHomepageSlides } from "@/lib/storefront/homepage-slides";

export default async function Home() {
  const [products, storefrontContent, homepageSlides] = await Promise.all([
    getCatalogProducts(),
    getStorefrontContent(),
    getHomepageSlides(),
  ]);

  return (
    <AppShell>
      <StorefrontHome content={storefrontContent} products={products} homepageSlides={homepageSlides} />
    </AppShell>
  );
}
