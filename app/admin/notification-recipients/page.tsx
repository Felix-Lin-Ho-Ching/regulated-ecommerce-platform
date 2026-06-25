import { AdminDataTable, AdminShell } from "@/components/admin/admin-shell";
import { RecipientForm, DeleteRecipientForm } from "@/components/admin/notification-recipients/recipient-forms";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export default async function NotificationRecipientsPage() {
  const recipients = isDatabaseConfigured ? await prisma.notificationRecipient.findMany({ orderBy: { createdAt: "desc" } }) : [];
  return <AdminShell title="Notification recipients" currentPath="/admin/notification-recipients"><div className="grid gap-5 lg:grid-cols-[360px_1fr]"><RecipientForm /><AdminDataTable columns={["Email", "Name", "Role", "Order", "Shipping", "Enabled", "Actions"]} rows={recipients.map((r: any) => [r.email, r.name || "—", r.role || "—", r.orderAlerts ? "Yes" : "No", r.shippingAlerts ? "Yes" : "No", r.enabled ? "Yes" : "No", <div key={r.id}><RecipientForm recipient={r} /><DeleteRecipientForm id={r.id} /></div>])} /></div></AdminShell>;
}
