import type { CatalogProduct } from "@/lib/db/catalog";
import type { StorefrontContent } from "@/lib/storefront-content/defaults";
import type { HomepageHeroMedia } from "@/lib/storefront/homepage-media";
import { FeaturedProducts } from "@/components/storefront/home/featured-products";
import { HeroMedia } from "@/components/storefront/home/hero-media";
import { HowOrderingWorks } from "@/components/storefront/home/how-ordering-works";
import { SituationCards } from "@/components/storefront/home/situation-cards";
import { TrustSection } from "@/components/storefront/home/trust-section";

export function StorefrontHome({ products, homepageMedia }: { content: StorefrontContent; products: CatalogProduct[]; homepageMedia: HomepageHeroMedia | null }) {
  return (
    <div className="space-y-12">
      <HeroMedia media={homepageMedia} />
      <SituationCards />
      <FeaturedProducts products={products} />
      <HowOrderingWorks />
      <TrustSection />
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-black">A quick reassurance</h2>
        <p className="mt-3 max-w-3xl text-stone-200">Product availability for restricted items is checked during checkout using the shipping destination and required verification steps. We do not guarantee eligibility before that review.</p>
      </section>
    </div>
  );
}
