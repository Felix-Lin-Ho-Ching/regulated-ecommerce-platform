import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";
export async function sendAndLogEmail(message: EmailMessage): Promise<EmailSendResult & { persisted: boolean; error?: string; providerMessageId?: string }> {
  const mode = process.env.EMAIL_MODE || "debug";
  const provider = mode === "live" ? (process.env.EMAIL_PROVIDER || "resend") : "debug";
  let status: any = "logged", providerMessageId: string | undefined, error: string | undefined;
  try {
    if (mode === "live") {
      if (provider !== "resend") throw new Error("EMAIL_PROVIDER must be resend for live email.");
      if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required when EMAIL_MODE=live.");
      if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is required when EMAIL_MODE=live.");
      const runtimeRequire = eval("require") as NodeRequire;
      const { Resend } = runtimeRequire("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const response = await resend.emails.send({ from: process.env.EMAIL_FROM, to: message.to, replyTo: process.env.EMAIL_REPLY_TO, subject: message.subject, text: message.text || "", html: message.html });
      providerMessageId = (response as any).data?.id || (response as any).id;
      status = "sent";
    }
  } catch (e) { status = "failed"; error = e instanceof Error ? e.message : String(e); }
  const metadata = { ...(message.metadata ?? {}), provider, status, providerMessageId, error };
  if (isDatabaseConfigured) await prisma.emailLog.create({ data: { type: message.type, to: message.to, subject: message.subject, provider, status, text: message.text, html: message.html, metadata, orderId: message.orderId } }).catch(() => undefined);
  return { provider: provider as any, status, persisted: isDatabaseConfigured, providerMessageId, error };
}
export const logDebugEmail = sendAndLogEmail;
export async function getEmailLogs(limit = 100) { if (!isDatabaseConfigured) return { available: false as const, logs: [] }; const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { order: { select: { orderNumber: true } } } }); return { available: true as const, logs }; }
