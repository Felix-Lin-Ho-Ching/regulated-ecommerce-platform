export type PaymentOpaqueData = { dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT"; dataValue: string };
export type PaymentCardSummary = { brand: string; last4: string; expMonth: string; expYear: string };
export type PaymentAddress = { name?: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country?: string; phone?: string };
export type AuthorizeNetChargeRequest = { amountCents: number; opaqueData: PaymentOpaqueData; billingAddress: PaymentAddress; shippingAddress: PaymentAddress; customerEmail: string; orderNumber: string };
export type AuthorizeNetChargeResponse = { status: "approved" | "declined" | "held_for_review" | "error"; responseCode: string; authCode?: string; transId: string; avsResultCode: string; cvvResultCode: string; messages: string[]; safeRawResponse: Record<string, unknown> };
