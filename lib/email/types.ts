export type EmailProviderName = "debug";
export type EmailLogStatus = "logged" | "skipped" | "failed";

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
