import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { requireAdminSession, type AdminSession } from "@/lib/admin/auth";

export const employeeRoles = ["OWNER", "ADMIN", "FULFILLMENT"] as const;
export type EmployeeRole = (typeof employeeRoles)[number];

export function isEmployeeRole(role: string): role is EmployeeRole {
  return employeeRoles.includes(role as EmployeeRole);
}

export function canManageEmployees(admin: AdminSession) {
  return admin.role === "OWNER" || admin.role === "ADMIN";
}

export async function requireEmployeeManager(nextPath = "/admin/employees") {
  const admin = await requireAdminSession(nextPath);
  if (!canManageEmployees(admin)) redirect("/admin/fulfillment?error=access-denied");
  return admin;
}

export async function getEmployeesForAdmin() {
  if (!isDatabaseConfigured) return { available: false, employees: [] as any[] };
  const employees = await prisma.adminUser.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true, lastLoginAt: true, role: { select: { code: true } } },
  });
  return { available: true, employees };
}

export async function hasBlockingEmployeeHistory(employeeId: string) {
  const [auditLogs, shipments] = await Promise.all([
    prisma.auditLog.count({ where: { actorAdminId: employeeId } }),
    prisma.auditLog.count({ where: { entityType: "shipment", entityId: employeeId } }),
  ]);
  return auditLogs > 0 || shipments > 0;
}
