export type EmailProviderName = "debug" | "resend";
export type EmailLogStatus = "logged" | "skipped" | "sent" | "failed";

export type EmailMessage = {
  type: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  orderId?: string;
};

export type EmailSendResult = {
  provider: EmailProviderName;
  status: EmailLogStatus;
};
