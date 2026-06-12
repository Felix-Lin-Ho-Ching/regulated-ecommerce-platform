export type AuthValidationResult = {
  ok: boolean;
  message?: string;
};

export function validateName(name: string): AuthValidationResult {
  if (name.trim().length < 2) {
    return { ok: false, message: "Enter your full name." };
  }

  return { ok: true };
}

export function validateEmail(email: string): AuthValidationResult {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return { ok: false, message: "Enter a valid email address." };
  }

  return { ok: true };
}

export function validatePassword(password: string): AuthValidationResult {
  if (password.length < 8) {
    return { ok: false, message: "Use at least 8 characters for your password." };
  }

  return { ok: true };
}
