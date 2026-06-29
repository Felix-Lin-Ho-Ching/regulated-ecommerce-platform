import { prisma } from "@/lib/db/prisma";
import { createMockAuthorizeNetTransaction } from "@/lib/payments/providers/mock-authorize-net";

export type PaymentMode = "order_request" | "mock_approved" | "mock_declined" | "mock_review";

export function normalizePaymentMode(mode = process.env.PAYMENT_MODE || "order_request"): PaymentMode {
  const normalized = mode.trim().toLowerCase().replaceAll("-", "_");
  if (normalized === "mock_approved" || normalized === "mock_declined" || normalized === "mock_review") return normalized;
  return "order_request";
}

export function isMockApprovedPaymentMode(mode = process.env.PAYMENT_MODE || "order_request") {
  return normalizePaymentMode(mode) === "mock_approved";
}

export async function processOrderPayment(tx: any, order: { id: string; orderNumber: string; totalCents: number }, mode = process.env.PAYMENT_MODE || "order_request") {
  const paymentMode = normalizePaymentMode(mode);

  if (paymentMode === "order_request") {
    return {
      mode: paymentMode,
      paymentAttempt: await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "ORDER_REQUEST",
          providerStatus: "DISABLED",
          status: "ORDER_REQUEST",
          amountCents: order.totalCents,
          livePaymentEnabled: false,
          providerReference: `order-request-${order.orderNumber}`,
        },
      }),
    };
  }

  const response = createMockAuthorizeNetTransaction({ orderNumber: order.orderNumber, amountCents: order.totalCents }, paymentMode);
  const status = response.status === "APPROVED" ? "APPROVED" : response.status === "DECLINED" ? "DECLINED" : "MANUAL_REVIEW";

  return {
    mode: paymentMode,
    response,
    paymentAttempt: await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: "AUTHORIZE_NET_MOCK",
        providerStatus: response.providerStatus,
        status,
        amountCents: response.amountCents,
        livePaymentEnabled: false,
        providerReference: response.transId,
      },
    }),
  };
}

export async function createApprovedMockPaymentAttemptIfNeeded(tx: any, order: { id: string; orderNumber: string; totalCents: number }) {
  const latest = await tx.paymentAttempt.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
  if (latest?.provider === "AUTHORIZE_NET_MOCK" && latest.status === "APPROVED") return latest;
  const response = createMockAuthorizeNetTransaction({ orderNumber: order.orderNumber, amountCents: order.totalCents }, "mock_approved");
  return tx.paymentAttempt.create({
    data: {
      orderId: order.id,
      provider: "AUTHORIZE_NET_MOCK",
      providerStatus: response.providerStatus,
      status: "APPROVED",
      amountCents: response.amountCents,
      livePaymentEnabled: false,
      providerReference: response.transId,
    },
  });
}

export { prisma };
