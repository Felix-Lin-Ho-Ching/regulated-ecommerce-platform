import { AppShell } from "@/components/ui";
import { StorefrontHome } from "@/components/store/storefront";
import { getCatalogProducts } from "@/lib/db/catalog";

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <AppShell>
      <StorefrontHome products={products} />
    </AppShell>
  );
}
