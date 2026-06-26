import Link from "next/link";
import { AdminShell, SectionHeader } from "@/components/ui";

const dashboardCards = [
  ["Products", "Create and maintain the product catalog.", "/admin/products"],
  ["Inventory", "Adjust stock and review inventory rows.", "/admin/inventory"],
  ["Orders", "Review customer order requests and order status.", "/admin/orders"],
  ["Fulfillment", "Claim, batch, and ship ready orders.", "/admin/fulfillment"],
  ["Storefront slideshow", "Manage homepage slideshow media and visible section copy.", "/admin/storefront"],
  ["Restricted rules", "Maintain state and ZIP/local restricted-product rules.", "/admin/compliance-rules"],
  ["Employees", "Manage owner/admin employee access.", "/admin/employees"],
  ["Notifications", "Manage order and shipping notification recipients.", "/admin/notification-recipients"],
  ["Readiness", "View simple operational readiness checks.", "/admin/launch-gates"],
];

export default function AdminDashboard() {
  return (
    <AdminShell title="Admin dashboard">
      <SectionHeader eyebrow="Operations" title="Owner/admin workspace">
        Fast access to the product, inventory, order, fulfillment, storefront, restricted-rule, employee, notification, readiness, and audit workflows.
      </SectionHeader>
      <div className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map(([title, description, href]) => (
          <Link className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg" href={href} key={href}>
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
