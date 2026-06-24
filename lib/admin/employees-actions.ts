"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { AdminActionState } from "@/lib/admin/action-state";
import { employeeRoles, isEmployeeRole, requireEmployeeManager, hasBlockingEmployeeHistory } from "@/lib/admin/employees";

function str(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function enabled(formData: FormData) { return formData.get("enabled") === "on"; }

async function roleIdFor(code: string) {
  const role = await prisma.adminRole.upsert({
    where: { code },
    update: { status: "ACTIVE" },
    create: { code, name: code[0] + code.slice(1).toLowerCase(), description: `${code} admin access`, status: "ACTIVE" },
  });
  return role.id;
}

async function ensureOwnerRemains(targetId: string, nextRole: string, nextStatus: string) {
  const target = await prisma.adminUser.findUnique({ where: { id: targetId }, select: { role: { select: { code: true } }, status: true } });
  if (!target || target.role.code !== "OWNER") return null;
  if (nextRole === "OWNER" && nextStatus === "ACTIVE") return null;
  const otherOwners = await prisma.adminUser.count({ where: { id: { not: targetId }, status: "ACTIVE", role: { code: "OWNER" } } });
  return otherOwners > 0 ? null : "At least one enabled owner account is required.";
}

async function audit(actor: Awaited<ReturnType<typeof requireEmployeeManager>>, action: string, targetId: string, targetEmail: string, metadata: Record<string, unknown> = {}) {
  await prisma.auditLog.create({ data: { actorAdminId: actor.adminId, action, entityType: "adminUser", entityId: targetId, note: `${action} for ${targetEmail} by ${actor.email}`, metadata: { actingAdminEmail: actor.email, targetEmployeeEmail: targetEmail, ...metadata } } });
}

export async function createEmployeeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireEmployeeManager();
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role");
  const password = String(formData.get("password") || "");
  if (!email) return { error: "Email is required." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Temporary password is required." };
  if (password.length < 8) return { error: "Temporary password must be at least 8 characters." };
  if (!isEmployeeRole(role)) return { error: "Select a valid role." };
  const duplicate = await prisma.adminUser.findUnique({ where: { email } });
  if (duplicate) return { error: "An employee with this email already exists." };
  const employee = await prisma.adminUser.create({ data: { email, name: name || email, passwordHash: hashPassword(password), status: enabled(formData) ? "ACTIVE" : "DISABLED", roleId: await roleIdFor(role) } });
  await audit(actor, "EMPLOYEE_CREATED", employee.id, email, { newRole: role });
  revalidatePath("/admin/employees");
  return { ok: true, success: "Employee created." };
}

export async function updateEmployeeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireEmployeeManager();
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const id = str(formData, "id");
  const name = str(formData, "name");
  const role = str(formData, "role");
  const password = String(formData.get("password") || "");
  const nextStatus = enabled(formData) ? "ACTIVE" : "DISABLED";
  if (!id) return { error: "Missing employee id." };
  if (!isEmployeeRole(role)) return { error: "Select a valid role." };
  if (password && password.length < 8) return { error: "Temporary password must be at least 8 characters." };
  const current = await prisma.adminUser.findUnique({ where: { id }, select: { email: true, role: { select: { code: true } } } });
  if (!current) return { error: "Employee not found." };
  const ownerError = await ensureOwnerRemains(id, role, nextStatus);
  if (ownerError) return { error: ownerError };
  const data: any = { name: name || current.email, roleId: await roleIdFor(role), status: nextStatus };
  if (password) data.passwordHash = hashPassword(password);
  await prisma.adminUser.update({ where: { id }, data });
  if (current.role.code !== role) await audit(actor, "EMPLOYEE_ROLE_CHANGED", id, current.email, { oldRole: current.role.code, newRole: role });
  await audit(actor, nextStatus === "ACTIVE" ? "EMPLOYEE_ENABLED" : "EMPLOYEE_DISABLED", id, current.email, { newRole: role });
  if (password) await audit(actor, "EMPLOYEE_PASSWORD_RESET", id, current.email);
  await audit(actor, "EMPLOYEE_UPDATED", id, current.email, { oldRole: current.role.code, newRole: role });
  revalidatePath("/admin/employees");
  return { ok: true, success: "Employee updated." };
}

export async function removeEmployeeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireEmployeeManager();
  if (!isDatabaseConfigured) return { error: "Database is not configured." };
  const id = str(formData, "id");
  if (!id) return { error: "Missing employee id." };
  const current = await prisma.adminUser.findUnique({ where: { id }, select: { email: true, role: { select: { code: true } } } });
  if (!current) return { error: "Employee not found." };
  const ownerError = await ensureOwnerRemains(id, "REMOVED", "DISABLED");
  if (ownerError) return { error: ownerError };
  if (await hasBlockingEmployeeHistory(id)) {
    await prisma.adminUser.update({ where: { id }, data: { status: "DISABLED" } });
    await audit(actor, "EMPLOYEE_DISABLED", id, current.email, { reason: "Hard delete blocked by audit or shipment history." });
    revalidatePath("/admin/employees");
    return { ok: true, success: "Employee has history and was disabled instead of removed." };
  }
  await audit(actor, "EMPLOYEE_REMOVED", id, current.email, { oldRole: current.role.code });
  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/employees");
  return { ok: true, success: "Employee removed." };
}
