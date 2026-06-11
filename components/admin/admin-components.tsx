import Link from "next/link";
import { StatusBadge } from "@/components/common/primitives";
import { auditLogs, complianceRules, launchGates } from "@/lib/mock-data";
import { brand } from "@/lib/config/brand";
import type { RuleCoverageRow } from "@/lib/db/catalog";

export function AdminSidebar() {
  const links = [
    "/admin",
    "/admin/products",
    "/admin/inventory",
    "/admin/orders",
    "/admin/verification-queue",
    "/admin/document-review",
    "/admin/compliance-rules",
    "/admin/verification-templates",
    "/admin/rule-coverage",
    "/admin/launch-gates",
    "/admin/audit-log",
    "/admin/backups",
  ];

  return (
    <aside className="admin-sidebar border-r border-stone-200 bg-slate-950 p-4 text-white md:min-h-screen">
      <Link href="/admin" className="text-xl font-black">
        {brand.adminName}
      </Link>
      <nav className="mt-6 grid gap-1 text-sm">
        {links.map((link) => (
          <Link className="rounded-lg px-3 py-2 hover:bg-white/10 focus-ring" href={link} key={link}>
            {link.replace("/admin", "Admin home").replaceAll("-", " ")}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{title}</h1>
        <StatusBadge tone="info">Mock operations · live checkout disabled</StatusBadge>
      </div>
    </header>
  );
}

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-grid">
      <AdminSidebar />
      <div>
        <AdminHeader title={title} />
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
  const data = rows ?? complianceRules.map((rule) => ({
    state: rule.state,
    category: rule.category,
    outcome: rule.outcome,
    coverage: rule.coverage,
    note: rule.note,
  }));

  return (
    <AdminDataTable
      columns={["State", "Category", "Coverage", "Outcome", "Launch impact"]}
      rows={data.map((rule) => [
        rule.state,
        rule.category,
        <StatusBadge
          key={`${rule.state}-${rule.category}`}
          tone={rule.coverage === "covered" ? "success" : rule.coverage === "missing" ? "danger" : "warning"}
        >
          {rule.coverage}
        </StatusBadge>,
        rule.outcome,
        rule.note,
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
            <StatusBadge tone={gate.state === "blocked" ? "danger" : gate.state === "ready" ? "warning" : "success"}>
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
        Sensitive actions require a keyboard-accessible confirmation dialog and a written reason.
      </p>
      <button className="btn btn-danger mt-3 focus-ring">Confirm mock action</button>
    </div>
  );
}
