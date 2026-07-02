import { prisma } from "@/lib/db/prisma";
import { paymentGateway, type PaymentGateway } from "@/lib/payments/gateways/payment-gateway";
import type { AuthorizeNetChargeRequest } from "@/lib/payments/gateways/authorize-net-types";

export async function processOrderPayment(tx: any, order: { id: string; orderNumber: string; totalCents: number }, charge: Omit<AuthorizeNetChargeRequest, "amountCents" | "orderNumber">, gateway: PaymentGateway = paymentGateway) {
  const response = await gateway.charge({ ...charge, amountCents: order.totalCents, orderNumber: order.orderNumber });
  const status = response.approved ? "APPROVED" : response.heldForReview ? "MANUAL_REVIEW" : "DECLINED";
  const providerStatus = response.heldForReview ? "MANUAL_REVIEW" : "DEVELOPMENT_APPROVED";
  const paymentAttempt = await tx.paymentAttempt.create({ data: { orderId: order.id, provider: "AUTHORIZE_NET_MOCK", providerStatus, status, amountCents: order.totalCents, livePaymentEnabled: false, providerReference: [response.transId, response.accountType, response.accountNumber].filter(Boolean).join(":") } });
  return { response, paymentAttempt };
}

export { prisma };
