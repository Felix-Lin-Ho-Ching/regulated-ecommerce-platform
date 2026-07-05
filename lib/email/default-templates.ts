export const EMAIL_TEMPLATE_TYPES = [
  "CUSTOMER_ORDER_CONFIRMATION",
  "CUSTOMER_PAYMENT_CONFIRMATION",
  "CUSTOMER_SHIPMENT",
  "CUSTOMER_CANCELLATION",
  "CUSTOMER_REFUND",
  "ADMIN_ORDER_NOTIFICATION",
  "ADMIN_PAYMENT_NOTIFICATION",
  "ADMIN_EMAIL_FAILURE",
  "FULFILLMENT_RELEASE_NOTIFICATION",
] as const;
export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];
const footer = "Stun Fry — contact {{supportEmail}} for help.";
const htmlShell = (title: string, body: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><tr><td><table role="presentation" width="100%" style="max-width:640px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px"><tr><td><h1>${title}</h1>${body}<p style="color:#64748b">{{footerText}}</p></td></tr></table></td></tr></table>`;
export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateType, { name: string; subject: string; textBody: string; htmlBody: string }> = {
  CUSTOMER_ORDER_CONFIRMATION: { name: "Customer order confirmation", subject: "Order confirmation {{orderNumber}}", textBody: `Hi {{customerName}},\n\nWe received your order {{orderNumber}}.\n\nItems:\n{{itemsList}}\n\nOrder total: {{total}}\n\nWe will email you again when your order ships.\n\n{{footerText}}`, htmlBody: htmlShell("Order confirmation {{orderNumber}}", `<p>Hi {{customerName}},</p><p>We received your order <b>{{orderNumber}}</b>.</p>{{itemsTable}}<p><b>Order total:</b> {{total}}</p>`) },
  CUSTOMER_PAYMENT_CONFIRMATION: { name: "Customer payment confirmation", subject: "Payment received for {{orderNumber}}", textBody: `Hi {{customerName}},\n\nPayment was collected for order {{orderNumber}}. Total: {{total}}.\n\n{{footerText}}`, htmlBody: htmlShell("Payment received", `<p>Payment was collected for order <b>{{orderNumber}}</b>.</p><p>Total: {{total}}</p>`) },
  CUSTOMER_SHIPMENT: { name: "Customer shipment", subject: "Your order {{orderNumber}} has shipped", textBody: `Hi {{customerName}},\n\nYour order {{orderNumber}} has shipped.\n\nCarrier: {{carrier}}\nTracking number: {{trackingNumber}}\nTrack your shipment: {{trackingUrl}}\n\nItems:\n{{itemsList}}\n\nIf you have questions, contact us at {{supportEmail}}.\n\n{{footerText}}`, htmlBody: htmlShell("Your order {{orderNumber}} has shipped", `<p>Hi {{customerName}},</p><table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse"><tr><td><b>Order</b></td><td>{{orderNumber}}</td></tr><tr><td><b>Carrier</b></td><td>{{carrier}}</td></tr><tr><td><b>Tracking number</b></td><td>{{trackingNumber}}</td></tr><tr><td><b>Tracking link</b></td><td><a href="{{trackingUrl}}">Track shipment</a></td></tr></table><h2>Items</h2>{{itemsTable}}<p>Questions? Contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>`) },
  CUSTOMER_CANCELLATION: { name: "Customer cancellation", subject: "Order {{orderNumber}} cancelled", textBody: `Your order {{orderNumber}} was cancelled. {{footerText}}`, htmlBody: htmlShell("Order cancelled", `<p>Your order {{orderNumber}} was cancelled.</p>`) },
  CUSTOMER_REFUND: { name: "Customer refund", subject: "Refund update for {{orderNumber}}", textBody: `Refund update for order {{orderNumber}}. {{footerText}}`, htmlBody: htmlShell("Refund update", `<p>Refund update for order {{orderNumber}}.</p>`) },
  ADMIN_ORDER_NOTIFICATION: { name: "Admin order notification", subject: "New order {{orderNumber}}", textBody: `New order {{orderNumber}} from {{customerEmail}}. Total: {{total}}.`, htmlBody: htmlShell("New order", `<p>Order {{orderNumber}} from {{customerEmail}}.</p>{{itemsTable}}`) },
  ADMIN_PAYMENT_NOTIFICATION: { name: "Admin payment notification", subject: "Payment collected {{orderNumber}}", textBody: `Payment collected for {{orderNumber}} from {{customerEmail}}.`, htmlBody: htmlShell("Payment collected", `<p>Payment collected for {{orderNumber}}.</p>`) },
  ADMIN_EMAIL_FAILURE: { name: "Admin email failure", subject: "Email failure for {{orderNumber}}", textBody: `An email failed for order {{orderNumber}}. Customer: {{customerEmail}}.`, htmlBody: htmlShell("Email failure", `<p>An email failed for order {{orderNumber}}.</p>`) },
  FULFILLMENT_RELEASE_NOTIFICATION: { name: "Fulfillment release notification", subject: "Order {{orderNumber}} ready to ship", textBody: `Order {{orderNumber}} is ready to ship.\n\nItems:\n{{itemsList}}`, htmlBody: htmlShell("Ready to ship", `<p>Order {{orderNumber}} is ready to ship.</p>{{itemsTable}}`) },
};
export const defaultFooterText = footer;
