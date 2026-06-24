import { StorefrontSettingsForm } from "@/components/admin/storefront/storefront-form";
import { AdminShell } from "@/components/ui";
import { getStorefrontContent } from "@/lib/storefront-content/service";
import { getHomepageHeroMediaForAdmin } from "@/lib/storefront/homepage-media";
import { HomepageMediaForm } from "@/components/admin/storefront/homepage-media-form";

export default async function StorefrontAdminPage() {
  const [content, homepageMedia] = await Promise.all([getStorefrontContent(), getHomepageHeroMediaForAdmin()]);

  return (
    <AdminShell title="Storefront content">
      <div className="grid gap-6"><HomepageMediaForm media={homepageMedia} /><StorefrontSettingsForm content={content} /></div>
    </AdminShell>
  );
}
