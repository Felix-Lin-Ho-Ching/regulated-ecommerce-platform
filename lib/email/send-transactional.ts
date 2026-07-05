import { sendAndLogEmail } from "@/lib/email/email-log-service";
import { renderTemplateForOrder } from "@/lib/email/template-service";
import type { EmailTemplateType } from "@/lib/email/default-templates";
export async function sendOrderTemplate(type: EmailTemplateType, order: any, to: string, extra: Record<string, unknown> = {}) {
  const rendered = await renderTemplateForOrder(type, order, extra);
  if (!rendered) return { status: "skipped" as const };
  return sendAndLogEmail({ type, to, subject: rendered.subject, text: rendered.text, html: rendered.html, orderId: order.id, metadata: { orderNumber: order.orderNumber, warnings: rendered.warnings, ...extra } });
}
export async function sendCustomerOrderTemplate(type: EmailTemplateType, order: any, extra: Record<string, unknown> = {}) { return sendOrderTemplate(type, order, order.customerEmail || "", extra); }
