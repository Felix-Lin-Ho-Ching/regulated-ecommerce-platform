import { FulfillmentDashboard } from "@/components/admin/fulfillment/fulfillment-dashboard";
import { AdminShell } from "@/components/ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { getFulfillmentSettings } from "@/lib/fulfillment/admin-actions";
import { getFulfillmentOrdersForAdmin } from "@/lib/fulfillment/admin-queries";

export default async function FulfillmentPage() {
  const admin = await requireAdminSession("/admin/fulfillment");
  const [settings, orders] = await Promise.all([
    getFulfillmentSettings(),
    getFulfillmentOrdersForAdmin(admin),
  ]);

  return (
    <AdminShell title="Fulfillment" currentPath="/admin/fulfillment">
      <FulfillmentDashboard admin={admin} settings={settings} orders={orders} />
    </AdminShell>
  );
}
