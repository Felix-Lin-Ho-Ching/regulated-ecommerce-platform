import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { sendDebugEmail } from "@/lib/email/debug-provider";
import type { EmailMessage } from "@/lib/email/types";

export async function logDebugEmail(message: EmailMessage) {
  const result = await sendDebugEmail(message);
  if (!isDatabaseConfigured) return { ...result, persisted: false };
  await prisma.emailLog.create({ data: { type: message.type, to: message.to, subject: message.subject, provider: result.provider, status: result.status, text: message.text, html: message.html, metadata: message.metadata ?? {}, orderId: message.orderId } });
  return { ...result, persisted: true };
}

export async function getEmailLogs(limit = 100) {
  if (!isDatabaseConfigured) return { available: false as const, logs: [] };
  const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { order: { select: { orderNumber: true } } } });
  return { available: true as const, logs };
}
