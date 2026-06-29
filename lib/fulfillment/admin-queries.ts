import type { AdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";

export type FulfillmentOrderForAdmin = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  shippedAt: Date | null;
  carrier: string | null;
  trackingNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  fulfillmentStatus: string;
  assignedFulfillmentUserId: string | null;
  assignedFulfillmentUser?: {
    name: string | null;
    email: string;
  } | null;
  shippingAddress?: {
    state: string;
    postalCode: string;
    line1?: string;
    line2?: string | null;
    city?: string;
    country?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    restricted: boolean;
  }>;
};

type OrderWithFulfillmentRelations = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  shippedAt: Date | null;
  carrier: string | null;
  trackingNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  fulfillmentStatus: string;
  assignedFulfillmentUserId: string | null;
  assignedFulfillmentUser: { name: string | null; email: string } | null;
  shippingAddress: { state: string; postalCode: string; line1?: string; line2?: string | null; city?: string; country?: string | null; name?: string | null; phone?: string | null } | null;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    product: { restricted: boolean } | null;
  }>;
};

function getFulfillmentOrderWhere(admin: AdminSession) {
  if (admin.role === "FULFILLMENT") {
    return {
      status: "PAID",
      fulfillmentStatus: { in: ["READY_TO_SHIP", "PICKING"] },
      OR: [
        { assignedFulfillmentUserId: admin.adminId },
        { assignedFulfillmentUserId: null, fulfillmentStatus: "READY_TO_SHIP" },
      ],
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    status: "PAID",
    fulfillmentStatus: { in: ["READY_TO_SHIP", "PICKING"] },
  };
}

function mapFulfillmentOrder(order: OrderWithFulfillmentRelations): FulfillmentOrderForAdmin {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    assignedFulfillmentUserId: order.assignedFulfillmentUserId,
    assignedFulfillmentUser: order.assignedFulfillmentUser,
    shippingAddress: order.shippingAddress,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      restricted: Boolean(item.product?.restricted),
    })),
  };
}

export async function getFulfillmentOrdersForAdmin(
  admin: AdminSession,
): Promise<FulfillmentOrderForAdmin[]> {
  const orders = await prisma.order.findMany({
    where: {
      ...getFulfillmentOrderWhere(admin),
      archivedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      shippingAddress: { select: { name: true, phone: true, line1: true, line2: true, city: true, state: true, postalCode: true, country: true } },
      assignedFulfillmentUser: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { restricted: true } },
        },
      },
    },
  });

  return orders.map(mapFulfillmentOrder);
}
