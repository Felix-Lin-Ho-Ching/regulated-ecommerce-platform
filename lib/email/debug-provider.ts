import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

export async function sendDebugEmail(_message: EmailMessage): Promise<EmailSendResult> {
  return { provider: "debug", status: "logged" };
}
