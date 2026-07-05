import type { AdminSession } from "@/lib/admin/auth";
import type { FulfillmentOrderForAdmin } from "@/lib/fulfillment/admin-queries";
import type { FulfillmentSettingsForAdmin } from "@/lib/fulfillment/admin-actions";
import { SectionHeader } from "@/components/ui";
import { ClaimBatchForm } from "@/components/admin/fulfillment/claim-batch-form";
import { FulfillmentSettingsForm } from "@/components/admin/fulfillment/fulfillment-settings-form";
import { FulfillmentOrdersTable } from "@/components/admin/fulfillment/fulfillment-orders-table";

type FulfillmentDashboardProps = {
  admin: AdminSession;
  settings: FulfillmentSettingsForAdmin;
  orders: FulfillmentOrderForAdmin[];
};

function getFulfillmentPageDescription(admin: AdminSession) {
  if (admin.role === "FULFILLMENT") {
    return "Paid, released orders assigned to you plus paid/released orders available to claim. Unpaid READY_FOR_PAYMENT order requests are intentionally hidden and are not fulfillment-ready.";
  }

  return "Only paid/released fulfillment work appears here: ready to ship, picking, blocked, and shipped-today orders. Unpaid READY_FOR_PAYMENT order requests are intentionally hidden until payment is collected and fulfillment is released.";
}

export function FulfillmentDashboard({
  admin,
  settings,
  orders,
}: FulfillmentDashboardProps) {
  const canEditSettings = ["OWNER", "ADMIN"].includes(admin.role);
  const canOperateFulfillment = admin.role === "FULFILLMENT";

  return (
    <>
      <SectionHeader eyebrow="Shipping" title="Fulfillment dashboard">
        {getFulfillmentPageDescription(admin)}
      </SectionHeader>

      <section className="card mt-6 p-5 text-sm text-slate-700">
        <h2 className="font-black text-slate-950">Fulfillment release policy</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Only paid orders released to fulfillment appear on this dashboard.</li>
          <li>Unpaid order requests are intentionally hidden from fulfillment operations.</li>
          <li>READY_FOR_PAYMENT orders are not fulfillment-ready.</li>
          <li>Payment must be collected before an order can be released, picked, packed, or shipped.</li>
        </ul>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {canOperateFulfillment ? <ClaimBatchForm settings={settings} /> : null}
        <FulfillmentSettingsForm settings={settings} canEdit={canEditSettings} />
      </div>

      <div className="mt-6">
        <FulfillmentOrdersTable admin={admin} orders={orders} />
        <p className="mt-2 text-sm text-slate-600">Showing up to 50 orders. Shipping confirmation is production-safe and must be completed one order at a time from the pick/pack page.</p>
      </div>
    </>
  );
}
