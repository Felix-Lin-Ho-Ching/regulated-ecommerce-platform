import type { CatalogProduct } from "@/lib/db/catalog";
import type { StorefrontContent } from "@/lib/storefront-content/defaults";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";
import { FeaturedProducts } from "@/components/storefront/home/featured-products";
import { HeroSlideshow } from "@/components/storefront/home/hero-slideshow";
import { HowOrderingWorks } from "@/components/storefront/home/how-ordering-works";
import { TrustSection } from "@/components/storefront/home/trust-section";

export function StorefrontHome({ products, homepageSlides }: { content: StorefrontContent; products: CatalogProduct[]; homepageSlides: HomepageSlide[] }) {
  return (
    <div className="space-y-12">
      <HeroSlideshow slides={homepageSlides} />
      <FeaturedProducts products={products} />
      <HowOrderingWorks />
      <TrustSection />
      <section id="responsible-ownership" className="rounded-3xl bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-black">A quick reassurance</h2>
        <p className="mt-3 max-w-3xl text-stone-200">Product availability for restricted items is checked during checkout using the shipping destination and required verification steps. We do not guarantee eligibility before that review.</p>
      </section>
    </div>
  );
}
