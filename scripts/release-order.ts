import { PrismaClient } from "@prisma/client";
import { releaseOrderAfterPaymentApproval } from "../lib/orders/order-service";

const prisma = new PrismaClient();

async function main() {
  const orderRef = process.argv[2];
  if (!orderRef) throw new Error("Usage: npm run order:release -- <orderId-or-orderNumber>");
  const order = await prisma.order.findFirst({ where: { OR: [{ id: orderRef }, { orderNumber: orderRef }] }, select: { id: true, orderNumber: true } });
  if (!order) throw new Error(`Order ${orderRef} not found.`);
  const released = await releaseOrderAfterPaymentApproval(order.id, { email: "dev-release-script", role: "DEVELOPER" });
  console.log(`Released ${released.orderNumber}: ${released.status}/${released.fulfillmentStatus}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
