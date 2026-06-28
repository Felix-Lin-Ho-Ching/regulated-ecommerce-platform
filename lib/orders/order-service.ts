import { cookies } from "next/headers";
import { evaluateCompliance } from "@/lib/compliance/compliance-service";
import { clearCart, getCartSnapshot, type CartSnapshot } from "@/lib/cart/cart-service";
import { getCustomerSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { logDebugEmail } from "@/lib/email/email-log-service";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildAdminNewOrderEmail } from "@/lib/email/templates/admin-new-order";

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
  hasRestrictedItems?: boolean;
  fulfillment: string;
  shipmentStatus: string;
  shippedAt?: string | null;
};

export type CustomerOrderDetail = CustomerOrderSummary & {
  subtotal: number;
  shipping: number;
  tax: number;
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number; total: number }>;
  shippingAddress?: ShippingDraft & { country?: string | null };
  carrier?: string | null;
  trackingNumber?: string | null;
};

export function customerOrderStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    ORDER_REQUEST_SUBMITTED: "Order request submitted",
    AUTO_ELIGIBLE: "Eligibility checks passed",
    READY_FOR_PAYMENT: "Ready for payment",
    SHIPPED: "Shipped",
    CANCELLED: "Cancelled",
    PAID: "Paid",
    FULFILLED: "Fulfilled",
    BLOCKED: "Blocked",
    PENDING_PAYMENT: "Pending payment",
    FULFILLMENT_HOLD: "Fulfillment not released",
    PENDING_ELIGIBILITY: "Eligibility pending",
  };
  return status ? labels[status] ?? status.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) : "Order request submitted";
}

export function customerPaymentStatusLabel(status?: string | null) {
  if (!status || status === "ORDER_REQUEST") return "Payment not collected";
  if (status === "APPROVED") return "Payment collected";
  return customerOrderStatusLabel(status);
}

export function customerFulfillmentStatusLabel(status?: string | null, orderStatus?: string | null) {
  if (orderStatus === "SHIPPED" || status === "SHIPPED") return "Shipped";
  return "Fulfillment not released";
}

function customerShipmentStatus(order: { status?: string | null; fulfillmentStatus?: string | null; shippedAt?: Date | string | null }) {
  return order.status === "SHIPPED" || order.fulfillmentStatus === "SHIPPED" || order.shippedAt ? "Shipped" : "Not shipped";
}

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
    reasons: ["Payment is not collected online during order-request checkout.", ...decision.reasons],
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

export async function createOrderRequestFromCart(): Promise<CustomerOrderSummary> {
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
    for (const line of cart.lines) {
      const product = await prisma.product.findFirst({ where: { id: line.product.id, archivedAt: null, status: { not: "ARCHIVED" } }, include: { variants: { include: { inventory: true } } } });
      const variant = product?.variants.find((candidate: any) => candidate.id === line.product.variantId);
      const available = Math.max(0, (variant?.inventory?.onHand ?? 0) - (variant?.inventory?.reserved ?? 0));
      if (!product || !variant || !variant.inventory) throw new Error("This item is not available for checkout.");
      if (line.quantity > available) throw new Error(`Only ${available} available.`);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.demo ? undefined : session?.userId,
        status: "ORDER_REQUEST_SUBMITTED",
        fulfillmentStatus: "FULFILLMENT_HOLD",
        subtotalCents: toCents(cart.subtotal),
        shippingCents: toCents(cart.shipping),
        taxCents: toCents(cart.tax),
        totalCents: toCents(cart.total),
        customerEmail: session?.email,
        customerName: shipping.name || session?.name,
        customerPhone: shipping.phone,
        liveCheckoutEnabled: false,
        liveFulfillmentEnabled: false,
        paymentMode: process.env.PAYMENT_MODE || "order_request",
        eligibilityResult: "AUTO_ELIGIBLE",
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
            phone: shipping.phone,
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
            provider: "ORDER_REQUEST",
            providerStatus: "ORDER_REQUEST",
            status: "ORDER_REQUEST",
            amountCents: toCents(cart.total),
            livePaymentEnabled: false,
            providerReference: `order-request-${orderNumber}`,
          },
        },
      },
      include: { items: { include: { product: { select: { restricted: true } } } }, shippingAddress: true },
    });

    await prisma.order.update({ where: { id: order.id }, data: { status: "AUTO_ELIGIBLE" } });
    const readyOrder = await prisma.order.update({ where: { id: order.id }, data: { status: "READY_FOR_PAYMENT" }, include: { items: { include: { product: { select: { restricted: true } } } }, shippingAddress: true } });

    await prisma.auditLog.createMany({ data: [
      { action: "CREATE", entityType: "Order", entityId: order.id, note: "Order request received.", metadata: { status: "ORDER_REQUEST_SUBMITTED" } },
      { action: "UPDATE", entityType: "Order", entityId: order.id, note: "Auto eligibility checks passed.", metadata: { status: "AUTO_ELIGIBLE" } },
      { action: "UPDATE", entityType: "Order", entityId: order.id, note: "Order request is ready for a future payment step; fulfillment is not released.", metadata: { status: "READY_FOR_PAYMENT", paymentCollected: false, fulfillmentReleased: false } },
    ] });

    for (const item of readyOrder.items) {
      const inventory = await prisma.inventory.findUnique({ where: { variantId: item.variantId }, select: { id: true } });
      if (inventory) {
        await prisma.inventory.update({ where: { id: inventory.id }, data: { reserved: { increment: item.quantity }, transactions: { create: { type: "RESERVATION", quantity: item.quantity, reason: `Order ${readyOrder.orderNumber} reservation after READY_FOR_PAYMENT` } }, reservations: { create: { orderItemId: item.id, quantity: item.quantity } } } });
      }
    }

    const confirmation = buildOrderConfirmationEmail({ orderNumber: readyOrder.orderNumber, createdAt: readyOrder.createdAt, items: readyOrder.items, totalCents: readyOrder.totalCents, shippingAddress: readyOrder.shippingAddress!, hasRestrictedItems: readyOrder.items.some((item: { product: { restricted: boolean } }) => item.product.restricted) });
    await logDebugEmail({ type: "ORDER_REQUEST_CONFIRMATION", to: session?.email ?? "guest@stunfry.example", subject: confirmation.subject, text: confirmation.text, orderId: readyOrder.id, metadata: { orderNumber: readyOrder.orderNumber } }).catch(() => undefined);
    const adminEmail = buildAdminNewOrderEmail({ orderNumber: readyOrder.orderNumber, customerEmail: session?.email, totalCents: readyOrder.totalCents, hasRestrictedItems: readyOrder.items.some((item: { product: { restricted: boolean } }) => item.product.restricted), shippingState: readyOrder.shippingAddress?.state, shippingPostalCode: readyOrder.shippingAddress?.postalCode, adminOrderUrl: `/admin/orders/${readyOrder.orderNumber}` });
    await logDebugEmail({ type: "ADMIN_NEW_ORDER", to: process.env.ADMIN_ORDER_EMAIL || process.env.ADMIN_EMAIL || "linhochingfelix@gmail.com", subject: adminEmail.subject, text: adminEmail.text, orderId: readyOrder.id, metadata: { orderNumber: readyOrder.orderNumber } }).catch(() => undefined);

    const recipients = await prisma.notificationRecipient.findMany({ where: { enabled: true, orderAlerts: true } });
    for (const recipient of recipients) {
      await logDebugEmail({ type: "INTERNAL_ORDER", to: recipient.email, subject: `Order request ${readyOrder.orderNumber}`, text: adminEmail.text, orderId: readyOrder.id, metadata: { orderNumber: readyOrder.orderNumber, fulfillmentReleased: false } }).catch(() => undefined);
    }

    await clearCart();

    return {
      orderNumber: readyOrder.orderNumber,
      status: "Ready for payment",
      total: readyOrder.totalCents / 100,
      payment: "Payment not collected",
      verification: "Eligibility checks passed",
      createdAt: readyOrder.createdAt.toISOString(),
      hasRestrictedItems: readyOrder.items.some((item: { product: { restricted: boolean } }) => item.product.restricted),
      fulfillment: "Fulfillment not released",
      shipmentStatus: "Not shipped",
    };
  }

  const order = {
    orderNumber,
    status: "Ready for payment",
    total: cart.total,
    payment: "Payment not collected",
    verification: "Eligibility checks passed",
    createdAt: new Date().toISOString(),
    hasRestrictedItems: cart.lines.some((line) => line.product.restricted),
    fulfillment: "Fulfillment not released",
    shipmentStatus: "Not shipped",
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
        fulfillmentStatus: true,
        shippedAt: true,
        items: { select: { product: { select: { restricted: true } } } },
        paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    });

    return rows.map((row: {
      orderNumber: string;
      status: string;
      totalCents: number;
      createdAt: Date;
      fulfillmentStatus: string;
      shippedAt: Date | null;
      items: Array<{ product: { restricted: boolean } }>;
      paymentAttempts: Array<{ status: string }>;
    }) => ({
      orderNumber: row.orderNumber,
      status: customerOrderStatusLabel(row.status),
      total: row.totalCents / 100,
      payment: customerPaymentStatusLabel(row.paymentAttempts[0]?.status),
      verification: row.status === "READY_FOR_PAYMENT" ? "Eligibility checks passed" : customerOrderStatusLabel(row.status),
      createdAt: row.createdAt.toISOString(),
      hasRestrictedItems: row.items.some((item: { product: { restricted: boolean } }) => item.product.restricted),
      fulfillment: customerFulfillmentStatusLabel(row.fulfillmentStatus, row.status),
      shipmentStatus: customerShipmentStatus(row),
      shippedAt: row.shippedAt?.toISOString() ?? null,
    }));
  }

  return getCookieOrders();
}

export async function getOrderByNumber(orderNumber: string): Promise<CustomerOrderDetail | null> {
  const session = await getCustomerSession();
  if (isDatabaseConfigured && session && !session.demo) {
    const row = await prisma.order.findFirst({
      where: { orderNumber, userId: session.userId, archivedAt: null },
      select: {
        orderNumber: true, status: true, subtotalCents: true, shippingCents: true, taxCents: true, totalCents: true, createdAt: true,
        fulfillmentStatus: true, carrier: true, trackingNumber: true, shippedAt: true,
        shippingAddress: { select: { name: true, line1: true, line2: true, city: true, state: true, postalCode: true, country: true, phone: true } },
        items: { select: { name: true, sku: true, quantity: true, unitPriceCents: true, product: { select: { restricted: true } } } },
        paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    });
    if (!row) return null;
    const shipped = customerShipmentStatus(row) === "Shipped";
    return {
      orderNumber: row.orderNumber,
      status: customerOrderStatusLabel(row.status),
      subtotal: row.subtotalCents / 100,
      shipping: row.shippingCents / 100,
      tax: row.taxCents / 100,
      total: row.totalCents / 100,
      payment: customerPaymentStatusLabel(row.paymentAttempts[0]?.status),
      verification: row.status === "READY_FOR_PAYMENT" || row.status === "SHIPPED" ? "Eligibility checks passed" : customerOrderStatusLabel(row.status),
      createdAt: row.createdAt.toISOString(),
      hasRestrictedItems: row.items.some((item: { product: { restricted: boolean } }) => item.product.restricted),
      fulfillment: customerFulfillmentStatusLabel(row.fulfillmentStatus, row.status),
      shipmentStatus: customerShipmentStatus(row),
      shippedAt: row.shippedAt?.toISOString() ?? null,
      carrier: shipped ? row.carrier : null,
      trackingNumber: shipped ? row.trackingNumber : null,
      shippingAddress: row.shippingAddress ?? undefined,
      items: row.items.map((item: { name: string; sku: string; quantity: number; unitPriceCents: number }) => ({ name: item.name, sku: item.sku, quantity: item.quantity, unitPrice: item.unitPriceCents / 100, total: (item.unitPriceCents * item.quantity) / 100 })),
    };
  }
  const orders = await getCookieOrders();
  const order = orders.find((candidate) => candidate.orderNumber === orderNumber);
  if (!order) return null;
  return { ...order, subtotal: order.total, shipping: 0, tax: 0, items: [] };
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
      productId: restrictedLine.product.id,
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
