import { StorefrontSettingsForm } from "@/components/admin/storefront/storefront-form";
import { AdminShell } from "@/components/ui";
import { getStorefrontContent } from "@/lib/storefront-content/service";
import { getHomepageSlidesForAdmin } from "@/lib/storefront/homepage-slides";
import { HomepageMediaForm } from "@/components/admin/storefront/homepage-media-form";

export default async function StorefrontAdminPage() {
  const [content, homepageSlides] = await Promise.all([getStorefrontContent(), getHomepageSlidesForAdmin()]);

  return (
    <AdminShell title="Storefront content">
      <div className="grid gap-6"><HomepageMediaForm slides={homepageSlides} /><StorefrontSettingsForm content={content} /></div>
    </AdminShell>
  );
}
