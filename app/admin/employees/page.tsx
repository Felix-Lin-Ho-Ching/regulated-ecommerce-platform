import { AdminDataTable, AdminShell, EmptyState, StatusBadge } from "@/components/ui";
import { CreateEmployeeForm, EditEmployeeForm, RemoveEmployeeForm } from "@/components/admin/employees/employee-forms";
import { getEmployeesForAdmin, requireEmployeeManager } from "@/lib/admin/employees";

function fmt(date?: Date | null) { return date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date) : "—"; }

export default async function EmployeesPage() {
  await requireEmployeeManager("/admin/employees");
  const result = await getEmployeesForAdmin();
  if (!result.available) return <AdminShell title="Employees"><EmptyState title="Database unavailable">Employee management requires DATABASE_URL.</EmptyState></AdminShell>;
  return <AdminShell title="Employees"><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><CreateEmployeeForm/><AdminDataTable columns={["Email", "Name", "Role", "Enabled", "Created", "Updated", "Last login", "Actions"]} rows={result.employees.map((employee: any) => [employee.email, employee.name, employee.role.code, <StatusBadge key="status" tone={employee.status === "ACTIVE" ? "success" : "danger"}>{employee.status === "ACTIVE" ? "Enabled" : "Disabled"}</StatusBadge>, fmt(employee.createdAt), fmt(employee.updatedAt), fmt(employee.lastLoginAt), <div key={employee.id}><EditEmployeeForm employee={employee}/><RemoveEmployeeForm id={employee.id}/></div>])}/></div></AdminShell>;
}
