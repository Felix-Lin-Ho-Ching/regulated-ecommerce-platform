import { AdminShell, SectionHeader, AdminDataTable } from "@/components/ui";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function FulfillmentDashboard() {
  await requireAdminSession("/admin/fulfillment");
  return <AdminShell title="Fulfillment"><SectionHeader eyebrow="Shipping" title="Fulfillment dashboard">Shipping employees can access shipment actions from this dashboard.</SectionHeader><AdminDataTable columns={["Queue", "Status", "Action"]} rows={[["Ready to ship", "Review orders paid and ready for shipment", "Open order detail"], ["Shipment confirmations", "Use secure fulfillment links or admin order actions", "Confirm shipment"]]} /></AdminShell>;
}
