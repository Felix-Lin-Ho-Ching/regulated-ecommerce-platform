import { requireAdminSession, type AdminSession } from "@/lib/admin/auth";

export type AdminRole = "OWNER" | "ADMIN" | "FULFILLMENT";

export function roleAllowed(session: Pick<AdminSession, "role">, roles: readonly string[]) {
  return roles.includes(session.role);
}

export async function requireOwnerOrAdmin(nextPath = "/admin") {
  const session = await requireAdminSession(nextPath);
  if (!roleAllowed(session, ["OWNER", "ADMIN"])) {
    throw new Error("Only OWNER and ADMIN users can perform this admin action.");
  }
  return session;
}

export async function requireOwnerOrAdminAction(nextPath = "/admin") {
  const session = await requireAdminSession(nextPath);
  if (!roleAllowed(session, ["OWNER", "ADMIN"])) return { error: "Only OWNER and ADMIN users can perform this admin action." } as const;
  return { session } as const;
}
