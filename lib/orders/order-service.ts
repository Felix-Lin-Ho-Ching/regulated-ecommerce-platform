import { cookies } from "next/headers";
import { evaluateCompliance } from "@/lib/compliance/compliance-service";
import { clearCart, getCartSnapshot, type CartSnapshot } from "@/lib/cart/cart-service";
import { getCustomerSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type CheckoutReadiness = {
  canCollectPayment: boolean;
  canFulfill: boolean;
  reasons: string[];
};

export type ShippingDraft = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
};

export type CustomerOrderSummary = {
  orderNumber: string;
  status: string;
  total: number;
  payment: string;
  verification: string;
  createdAt: string;
};

const shippingCookieName = "stun_fry_shipping";
const ordersCookieName = "stun_fry_orders";

export async function getCheckoutReadiness(
  productCategory: string,
  stateCode: string,
): Promise<CheckoutReadiness> {
  const decision = await evaluateCompliance({ productCategory, stateCode });
  return {
    canCollectPayment: false,
    canFulfill: false,
    reasons: ["Payment is available after eligibility is approved.", ...decision.reasons],
  };
}

export async function saveShippingDraft(draft: ShippingDraft) {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(draft), "utf8").toString("base64url");
  cookieStore.set(shippingCookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function getShippingDraft(): Promise<ShippingDraft> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(shippingCookieName)?.value;

  if (raw) {
    try {
      return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as ShippingDraft;
    } catch {
      // Fall back to the default shipping draft below.
    }
  }

  return {
    name: "Taylor Brooks",
    line1: "410 Congress Ave",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    phone: "555-0129",
  };
}

function toCents(value: number) {
  return Math.round(value * 100);
}

async function getCookieOrders(): Promise<CustomerOrderSummary[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ordersCookieName)?.value;

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CustomerOrderSummary[];
  } catch {
    return [];
  }
}

async function saveCookieOrder(order: CustomerOrderSummary) {
  const cookieStore = await cookies();
  const orders = [order, ...(await getCookieOrders())].slice(0, 10);
  const value = Buffer.from(JSON.stringify(orders), "utf8").toString("base64url");
  cookieStore.set(ordersCookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

function buildOrderNumber() {
  return `SF-${Date.now().toString().slice(-6)}`;
}

export async function createMockOrderFromCart(): Promise<CustomerOrderSummary> {
  const [session, cart, shipping] = await Promise.all([
    getCustomerSession(),
    getCartSnapshot(),
    getShippingDraft(),
  ]);

  if (cart.lines.length === 0) {
    throw new Error("Cart is empty.");
  }

  const orderNumber = buildOrderNumber();

  if (isDatabaseConfigured) {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.demo ? undefined : session?.userId,
        status: "FULFILLMENT_HOLD",
        subtotalCents: toCents(cart.subtotal),
        shippingCents: toCents(cart.shipping),
        taxCents: toCents(cart.tax),
        totalCents: toCents(cart.total),
        liveCheckoutEnabled: false,
        liveFulfillmentEnabled: false,
        shippingAddress: {
          create: {
            name: shipping.name,
            line1: shipping.line1,
            line2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            postalCode: shipping.postalCode,
            normalized: true,
            deliverable: true,
          },
        },
        items: {
          create: cart.lines.map((line) => ({
            productId: line.product.id,
            variantId: line.product.variantId,
            name: line.product.name,
            sku: line.product.sku,
            quantity: line.quantity,
            unitPriceCents: toCents(line.product.price),
          })),
        },
        paymentAttempts: {
          create: {
            provider: "MOCK",
            providerStatus: "DEVELOPMENT_APPROVED",
            status: "APPROVED",
            amountCents: toCents(cart.total),
            livePaymentEnabled: false,
            providerReference: `mock-approved-${orderNumber}`,
          },
        },
      },
      select: { orderNumber: true, status: true, totalCents: true, createdAt: true },
    });

    await clearCart();

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.totalCents / 100,
      payment: "test confirmation",
      verification: "approved",
      createdAt: order.createdAt.toISOString(),
    };
  }

  const order = {
    orderNumber,
    status: "FULFILLMENT_HOLD",
    total: cart.total,
    payment: "test confirmation",
    verification: "approved",
    createdAt: new Date().toISOString(),
  };

  await saveCookieOrder(order);
  await clearCart();
  return order;
}

export async function getCustomerOrders(): Promise<CustomerOrderSummary[]> {
  const session = await getCustomerSession();

  if (isDatabaseConfigured && session && !session.demo) {
    const rows = await prisma.order.findMany({
      where: { userId: session.userId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    });

    return rows.map((row: {
      orderNumber: string;
      status: string;
      totalCents: number;
      createdAt: Date;
      paymentAttempts: Array<{ status: string }>;
    }) => ({
      orderNumber: row.orderNumber,
      status: row.status,
      total: row.totalCents / 100,
      payment: row.paymentAttempts[0]?.status.toLowerCase() || "not started",
      verification: row.status === "PAID" ? "approved" : "pending",
      createdAt: row.createdAt.toISOString(),
    }));
  }

  return getCookieOrders();
}

export async function getOrderByNumber(orderNumber: string) {
  const orders = await getCustomerOrders();
  return orders.find((order) => order.orderNumber === orderNumber) || null;
}

export function getCartLineCount(cart: CartSnapshot) {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export type CheckoutEligibilitySnapshot = {
  result: import("@/lib/eligibility/rules").EligibilityResult;
  hasRestrictedItems: boolean;
  checkedProducts: Array<{ name: string; category: string; restricted: boolean }>;
};

export async function getCheckoutEligibilitySnapshot(
  isAtLeast18 = true,
): Promise<CheckoutEligibilitySnapshot> {
  const { evaluateEligibilityFromConfiguredRules } = await import("@/lib/eligibility/rules");
  const [cart, shipping] = await Promise.all([getCartSnapshot(), getShippingDraft()]);
  const restrictedLine = cart.lines.find((line) => line.product.restricted);

  if (!restrictedLine) {
    return {
      result: await evaluateEligibilityFromConfiguredRules({ restricted: false }),
      hasRestrictedItems: false,
      checkedProducts: cart.lines.map((line) => ({
        name: line.product.name,
        category: line.product.category,
        restricted: line.product.restricted,
      })),
    };
  }

  return {
    result: await evaluateEligibilityFromConfiguredRules({
      state: shipping.state,
      zip: shipping.postalCode,
      isAtLeast18,
      productCategory: restrictedLine.product.category,
      restricted: true,
    }),
    hasRestrictedItems: true,
    checkedProducts: cart.lines.map((line) => ({
      name: line.product.name,
      category: line.product.category,
      restricted: line.product.restricted,
    })),
  };
}
