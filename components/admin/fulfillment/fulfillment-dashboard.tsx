import type { AdminSession } from "@/lib/admin/auth";
import type { FulfillmentOrderForAdmin } from "@/lib/fulfillment/admin-queries";
import type { FulfillmentSettingsForAdmin } from "@/lib/fulfillment/admin-actions";
import { SectionHeader } from "@/components/ui";
import { ClaimBatchForm } from "@/components/admin/fulfillment/claim-batch-form";
import { FulfillmentSettingsForm } from "@/components/admin/fulfillment/fulfillment-settings-form";
import { FulfillmentOrdersTable } from "@/components/admin/fulfillment/fulfillment-orders-table";
import { ShipSelectedForm } from "@/components/admin/fulfillment/ship-selected-form";

type FulfillmentDashboardProps = {
  admin: AdminSession;
  settings: FulfillmentSettingsForAdmin;
  orders: FulfillmentOrderForAdmin[];
};

function getFulfillmentPageDescription(admin: AdminSession) {
  if (admin.role === "FULFILLMENT") {
    return "Assigned to me and ready-to-claim orders.";
  }

  return "Ready to ship, assigned, shipped today, and blocked orders.";
}

export function FulfillmentDashboard({
  admin,
  settings,
  orders,
}: FulfillmentDashboardProps) {
  const canEditSettings = ["OWNER", "ADMIN"].includes(admin.role);

  return (
    <>
      <SectionHeader eyebrow="Shipping" title="Fulfillment dashboard">
        {getFulfillmentPageDescription(admin)}
      </SectionHeader>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ClaimBatchForm settings={settings} />
        <FulfillmentSettingsForm settings={settings} canEdit={canEditSettings} />
      </div>

      <div className="mt-6">
        <ShipSelectedForm>
          <FulfillmentOrdersTable admin={admin} orders={orders} />
        </ShipSelectedForm>
        <p className="mt-2 text-sm text-slate-600">Showing up to 50 orders.</p>
      </div>
    </>
  );
}
