export type AuthorizeNetMockStatus = "APPROVED" | "DECLINED" | "MANUAL_REVIEW";

export type AuthorizeNetMockRequest = {
  orderNumber: string;
  amountCents: number;
};

export type AuthorizeNetMockResponse = {
  provider: "AUTHORIZE_NET_MOCK";
  providerStatus: "DEVELOPMENT_APPROVED" | "MANUAL_REVIEW";
  status: AuthorizeNetMockStatus;
  responseCode: "1" | "2" | "4";
  authCode?: string;
  transId: string;
  amountCents: number;
  avsResultCode: string;
  cvvResultCode: string;
  accountType: string;
  accountNumber: string;
};

export function createMockAuthorizeNetTransaction(
  request: AuthorizeNetMockRequest,
  mode: "mock_approved" | "mock_declined" | "mock_review",
): AuthorizeNetMockResponse {
  const base = {
    provider: "AUTHORIZE_NET_MOCK" as const,
    transId: `MOCK-TXN-${request.orderNumber}`,
    amountCents: request.amountCents,
    avsResultCode: "Y",
    cvvResultCode: "M",
    accountType: "Visa",
    accountNumber: "XXXX1111",
  };

  if (mode === "mock_declined") {
    return { ...base, providerStatus: "DEVELOPMENT_APPROVED", status: "DECLINED", responseCode: "2" };
  }

  if (mode === "mock_review") {
    return { ...base, providerStatus: "MANUAL_REVIEW", status: "MANUAL_REVIEW", responseCode: "4" };
  }

  return {
    ...base,
    providerStatus: "DEVELOPMENT_APPROVED",
    status: "APPROVED",
    responseCode: "1",
    authCode: "MOCK123",
  };
}
