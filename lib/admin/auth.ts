"use server";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
  role: string;
  demo: boolean;
};

const adminSessionCookieName = "stun_fry_admin";
const fallbackSecret = "stun-fry-local-mvp-admin-session-secret";

function getSessionSecret() {
  const configuredSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return configuredSecret || fallbackSecret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encodeSession(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(value?: string): AdminSession | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(signPayload(payload));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
  } catch {
    return null;
  }
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

function getConfiguredAdminCredentials() {
  if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    throw new Error("Admin credentials must be configured in production.");
  }
  // Local development seed credential only. Replace before production.
  return {
    email: (process.env.ADMIN_EMAIL || "linhochingfelix@gmail.com").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "linhochingfelix",
  };
}

function getNextPath(formData: FormData) {
  const next = String(formData.get("next") || "/admin");

  if (next === "/admin" || next.startsWith("/admin/")) {
    return next;
  }

  return "/admin";
}

async function setAdminSession(session: AdminSession) {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(adminSessionCookieName)?.value);
}

export async function requireAdminSession(nextPath = "/admin") {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/staff/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!session.demo && isDatabaseConfigured) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.adminId },
      select: { id: true, email: true, name: true, status: true, role: { select: { code: true } } },
    });

    if (!admin || admin.status !== "ACTIVE") {
      const cookieStore = await cookies();
      cookieStore.delete(adminSessionCookieName);
      redirect("/staff/login?error=Account disabled. Contact the owner.");
    }

    if (admin.role.code !== session.role || admin.email !== session.email || admin.name !== session.name) {
      session.email = admin.email;
      session.name = admin.name;
      session.role = admin.role.code;
      await setAdminSession(session);
    }
  }

  if (session.role === "FULFILLMENT" && !nextPath.startsWith("/admin/fulfillment")) {
    redirect("/admin/fulfillment?error=access-denied");
  }

  return session;
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = getNextPath(formData);

  for (const result of [validateEmail(email), validatePassword(password)]) {
    if (!result.ok) {
      redirect(`/staff/login?error=${encodeURIComponent(result.message || "Check the form.")}`);
    }
  }

  if (!isDatabaseConfigured) {
    const credentials = getConfiguredAdminCredentials();

    if (!safeEquals(email, credentials.email) || !safeEquals(password, credentials.password)) {
      redirect("/staff/login?error=Invalid email or password.");
    }

    await setAdminSession({ adminId: `local-${email}`, email, name: "Felix Lin", role: "OWNER", demo: true });
    redirect(nextPath);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, status: true, role: { select: { code: true } } },
  });

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    redirect("/staff/login?error=Invalid email or password.");
  }

  if (admin.status !== "ACTIVE") {
    redirect("/staff/login?error=Account disabled. Contact the owner.");
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const destination = admin.role.code === "FULFILLMENT" && nextPath === "/admin" ? "/admin/fulfillment" : nextPath;

  await setAdminSession({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role.code,
    demo: false,
  });

  redirect(destination);
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);
  redirect("/staff/login?message=You have been logged out.");
}
