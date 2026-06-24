import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { complianceRules, launchGates, auditLogs } from "@/lib/mock-data";
import type { RuleCoverageRow } from "@/lib/db/catalog";
import { StatusBadge } from "@/components/common/badge";
import { adminLogoutAction, requireAdminSession } from "@/lib/admin/auth";

export function AdminSidebar({ role }: { role: string }) {
  const ownerAdminLinks = [
    ["/admin", "Dashboard"],
    ["/admin/products", "Products"],
    ["/admin/inventory", "Inventory"],
    ["/admin/orders", "Orders"],
    ["/admin/fulfillment", "Fulfillment"],
    ["/admin/notification-recipients", "Notification recipients"],
    ["/admin/employees", "Employees"],
    ["/admin/compliance-rules", "Compliance rules"],
    ["/admin/storefront", "Storefront"],
    ["/admin/audit-log", "Audit log"],
    ["/admin/launch-gates", "Launch gates"],
  ];
  const links = role === "FULFILLMENT" ? [["/admin/fulfillment", "Fulfillment"]] : ownerAdminLinks;

  return (
    <aside className="admin-sidebar border-r border-stone-200 bg-slate-950 p-4 text-white md:min-h-screen">
      <Link href={role === "FULFILLMENT" ? "/admin/fulfillment" : "/admin"} className="text-xl font-black">
        {brand.adminName}
      </Link>
      <nav className="mt-6 grid gap-1 text-sm">
        {links.map(([href, label]) => (
          <Link className="rounded-lg px-3 py-2 hover:bg-white/10 focus-ring" href={href} key={href}>
            {label}
          </Link>
        ))}
        {role === "FULFILLMENT" ? <form action={adminLogoutAction}><button className="rounded-lg px-3 py-2 text-left hover:bg-white/10 focus-ring">Logout</button></form> : null}
      </nav>
    </aside>
  );
}

export function AdminHeader({ title, adminName }: { title: string; adminName: string }) {
  return (
    <header className="border-b border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{title}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge tone="info">{adminName}</StatusBadge>
          <form action={adminLogoutAction}>
            <button className="btn btn-secondary text-sm" type="submit">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

export async function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const admin = await requireAdminSession();

  return (
    <div className="admin-grid">
      <AdminSidebar role={admin.role} />
      <div>
        <AdminHeader title={title} adminName={admin.name} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminDataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="card overflow-x-auto">
      <div className="flex gap-3 border-b p-4">
        <input className="input max-w-xs" aria-label="Search table" placeholder="Search" />
        <select className="input max-w-48" aria-label="Filter status">
          <option>All statuses</option>
          <option>Pending</option>
          <option>Blocked</option>
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RuleCoverageMatrix({ rows }: { rows?: RuleCoverageRow[] }) {
  const data =
    rows ??
    complianceRules.map((rule) => ({
      state: rule.state,
      category: rule.category,
      outcome: rule.outcome,
      coverage: rule.coverage,
      note: rule.note,
    }));

  return (
    <AdminDataTable
      columns={["State", "Category", "Coverage", "Outcome", "Launch impact"]}
      rows={data.map((row) => [
        row.state,
        row.category,
        <StatusBadge
          key={`${row.state}-${row.category}`}
          tone={
            row.coverage === "covered" ? "success" : row.coverage === "missing" ? "danger" : "warning"
          }
        >
          {row.coverage}
        </StatusBadge>,
        row.outcome,
        row.note,
      ])}
    />
  );
}

export function LaunchGateCard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {launchGates.map((gate) => (
        <section className="card p-5" key={gate.name}>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">{gate.name}</h2>
            <StatusBadge
              tone={gate.state === "blocked" ? "danger" : gate.state === "ready" ? "warning" : "success"}
            >
              {gate.state}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {gate.ownerOnly
              ? "Owner-only gate. Enable action requires all blockers cleared."
              : "Operational gate visible to admins."}
          </p>
          <button className="btn btn-secondary mt-4 focus-ring" disabled={gate.state === "blocked"}>
            {gate.state === "enabled" ? "Enabled" : "Review gate"}
          </button>
        </section>
      ))}
    </div>
  );
}

export function AuditLogTable() {
  return (
    <AdminDataTable
      columns={["Time", "Actor", "Action", "Target", "Required note"]}
      rows={auditLogs.map((auditLog) => [
        auditLog.time,
        auditLog.actor,
        auditLog.action,
        auditLog.target,
        auditLog.note,
      ])}
    />
  );
}

export function ConfirmDialog() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <h2 className="font-black">Confirmation required</h2>
      <p className="text-sm">
        Dangerous actions require a keyboard-accessible confirmation dialog and a written reason in
        the implemented product.
      </p>
      <button className="btn btn-danger mt-3 focus-ring">Confirm mock action</button>
    </div>
  );
}
