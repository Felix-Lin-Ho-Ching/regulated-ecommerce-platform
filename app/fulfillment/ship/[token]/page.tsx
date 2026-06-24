import { AppShell, SectionHeader, StatusBadge } from "@/components/ui";
import { AlertPanel } from "@/components/common/panels";
import { FulfillmentShipForm } from "@/components/fulfillment-ship-form";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { hashFulfillmentToken } from "@/lib/fulfillment/tokens";

export default async function FulfillmentShipPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashFulfillmentToken(token);
  const fulfillmentToken = isDatabaseConfigured ? await prisma.fulfillmentToken.findUnique({ where: { tokenHash }, include: { order: { include: { shippingAddress: true, items: { include: { product: { select: { restricted: true } } } } } } } }) : null;
  if (!fulfillmentToken) return <AppShell><SectionHeader eyebrow="Fulfillment" title="Invalid fulfillment link" /><AlertPanel title="Link unavailable" tone="danger">This fulfillment link is invalid.</AlertPanel></AppShell>;
  const order = fulfillmentToken.order;
  const already = Boolean(fulfillmentToken.usedAt || order.status === "SHIPPED");
  const expired = fulfillmentToken.expiresAt < new Date();
  return <AppShell><SectionHeader eyebrow="Fulfillment" title={`Ship order ${order.orderNumber}`}>This secure link only confirms shipment for this order.</SectionHeader><section className="card mt-6 p-5"><div className="flex gap-2"><StatusBadge tone={already ? "success" : expired ? "danger" : "warning"}>{already ? "Already shipped" : expired ? "Expired" : "Ready to ship"}</StatusBadge></div><dl className="mt-4 grid gap-2 text-sm"><div><dt className="font-bold">Customer</dt><dd>{order.customerName || "—"}</dd></div><div><dt className="font-bold">Shipping address</dt><dd>{order.shippingAddress ? `${order.shippingAddress.line1}${order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}` : "—"}</dd></div></dl><div className="mt-5 divide-y rounded-2xl border">{order.items.map((item: any) => <div className="grid gap-1 p-4" key={item.id}><strong>{item.name}</strong><span>SKU: {item.sku}</span><span>Quantity: {item.quantity}</span>{item.product.restricted ? <span className="font-bold text-amber-800">Restricted item: verify compliant shipment handling.</span> : null}</div>)}</div></section>{already ? <AlertPanel title="Already shipped" tone="success">Already shipped</AlertPanel> : expired ? <AlertPanel title="Link expired" tone="danger">Ask an admin to resend the fulfillment email/log.</AlertPanel> : <FulfillmentShipForm token={token} />}</AppShell>;
}
