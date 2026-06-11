export type MockPaymentRequest = { orderNumber: string; amountCents: number; provider: "MOCK" | "NMI" };
export type MockPaymentResult = { status: "APPROVED" | "MANUAL_REVIEW"; livePaymentEnabled: false; reference: string; message: string };

export async function authorizeMockPayment(request: MockPaymentRequest): Promise<MockPaymentResult> {
  if (request.provider === "NMI") return { status: "MANUAL_REVIEW", livePaymentEnabled: false, reference: `nmi-manual-${request.orderNumber}`, message: "NMI remains in manual_review until provider approval." };
  return { status: "APPROVED", livePaymentEnabled: false, reference: `mock-approved-${request.orderNumber}`, message: "Mock provider approved for development only; live payment remains disabled." };
}
