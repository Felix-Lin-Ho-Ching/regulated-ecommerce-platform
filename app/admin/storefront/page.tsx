import { StorefrontSettingsForm } from "@/components/admin/storefront/storefront-form";
import { AdminShell } from "@/components/ui";
import { getStorefrontContent } from "@/lib/storefront-content/service";

export default async function StorefrontAdminPage() {
  const content = await getStorefrontContent();

  return (
    <AdminShell title="Storefront content">
      <StorefrontSettingsForm content={content} />
    </AdminShell>
  );
}
