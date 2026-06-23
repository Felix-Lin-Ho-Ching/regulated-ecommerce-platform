"use server";

import { redirect } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearCustomerSession, setCustomerSession } from "@/lib/auth/session";
import { validateEmail, validateName, validatePassword } from "@/lib/auth/validation";

function isLocalAdminEmail(email: string) {
  return email === (process.env.ADMIN_EMAIL || "linhochingfelix@gmail.com").trim().toLowerCase();
}

function getNextPath(formData: FormData) {
  const next = String(formData.get("next") || "/account");
  return next.startsWith("/") ? next : "/account";
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = getNextPath(formData);

  for (const result of [validateName(name), validateEmail(email), validatePassword(password)]) {
    if (!result.ok) {
      redirect(`/account/signup?error=${encodeURIComponent(result.message || "Check the form.")}`);
    }
  }

  if (!isDatabaseConfigured) {
    await setCustomerSession({ userId: `demo-${email}`, email, name, demo: true });
    redirect(nextPath);
  }

  const passwordHash = hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    await setCustomerSession({
      userId: user.id,
      email: user.email,
      name: user.name || "Stun Fry customer",
      demo: false,
    });
  } catch {
    redirect("/account/signup?error=An account already exists for that email.");
  }

  redirect(nextPath);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = getNextPath(formData);

  for (const result of [validateEmail(email), validatePassword(password)]) {
    if (!result.ok) {
      redirect(`/account/login?error=${encodeURIComponent(result.message || "Check the form.")}`);
    }
  }

  if (!isDatabaseConfigured) {
    if (isLocalAdminEmail(email)) {
      redirect("/account/login?error=Invalid email or password.");
    }

    await setCustomerSession({
      userId: `demo-${email}`,
      email,
      name: email.split("@")[0] || "Stun Fry customer",
      demo: true,
    });
    redirect(nextPath);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== "ACTIVE" || !verifyPassword(password, user.passwordHash)) {
    redirect("/account/login?error=Invalid email or password.");
  }

  await setCustomerSession({
    userId: user.id,
    email: user.email,
    name: user.name || "Stun Fry customer",
    demo: false,
  });

  redirect(nextPath);
}

export async function logoutAction() {
  await clearCustomerSession();
  redirect("/account/login?message=You have been logged out.");
}
