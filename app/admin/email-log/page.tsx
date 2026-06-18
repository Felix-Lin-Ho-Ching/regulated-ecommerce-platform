import Link from "next/link";
import { AdminShell, AdminDataTable, EmptyState, StatusBadge } from "@/components/ui";
import { getEmailLogs } from "@/lib/email/email-log-service";

export const dynamic = "force-dynamic";

const fmt = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function EmailLogAdmin() {
  const result = await getEmailLogs();
  if (!result.available) return <AdminShell title="Email log"><EmptyState title="Database unavailable">Debug email logs require DATABASE_URL.</EmptyState></AdminShell>;
  return <AdminShell title="Email log"><AdminDataTable columns={["Time", "Type", "Recipient", "Subject", "Status", "Provider", "Order"]} rows={result.logs.map((log: any) => [fmt(log.createdAt), log.type, log.to, log.subject, <StatusBadge key={log.id} tone="info">{log.status}</StatusBadge>, log.provider, log.order?.orderNumber ? <Link key={log.id} href={`/admin/orders/${log.order.orderNumber}`}>{log.order.orderNumber}</Link> : "—"])} /></AdminShell>;
}
