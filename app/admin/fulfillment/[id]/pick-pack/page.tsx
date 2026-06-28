import Link from "next/link";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";

const fmt = (date: Date | null) => date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date) : "—";

export default async function PickPackPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession("/admin/fulfillment");
  const { id } = await params;
  const order: any = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }], archivedAt: null },
    include: {
      shippingAddress: true,
      assignedFulfillmentUser: { select: { name: true, email: true } },
      items: { include: { product: { select: { restricted: true } }, variant: { include: { inventory: { include: { reservations: true } } } } } },
    },
  });

  if (!order) return <AdminShell title="Pick/pack"><EmptyState title="Order not found">This fulfillment order could not be found.</EmptyState></AdminShell>;
  const address = order.shippingAddress;
  const hasRestrictedItem = order.items.some((item: any) => item.product?.restricted);
  const isReleased = order.status === "PAID" && ["READY_TO_SHIP", "PICKING", "SHIPPED"].includes(order.fulfillmentStatus);

  return (
    <AdminShell title={`Pick/pack ${order.orderNumber}`} currentPath="/admin/fulfillment">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden"><Link className="btn btn-secondary" href="/admin/fulfillment">Back to fulfillment</Link><span className="btn btn-primary">Use browser print</span></div>
      <SectionHeader eyebrow="Printable pick / pack" title={order.orderNumber}>Payment collected required before shipment. This view is operational only and does not release unpaid orders.</SectionHeader>
      {!isReleased ? <section className="card mt-4 border-amber-300 bg-amber-50 p-5 text-sm font-bold text-amber-900">Fulfillment is not released for this order. Payment must be collected before picking, packing, or shipment.</section> : null}
      <section className="card mt-4 grid gap-4 p-5 md:grid-cols-2">
        <div><h2 className="font-black">Ship to</h2><p className="mt-2 text-sm">{[address?.name, address?.line1, address?.line2, `${address?.city ?? ""}, ${address?.state ?? ""} ${address?.postalCode ?? ""}`, address?.country].filter(Boolean).join("\n") || "—"}</p></div>
        <div><h2 className="font-black">Customer contact</h2><dl className="mt-2 text-sm"><dt className="font-bold">Name</dt><dd>{order.customerName || address?.name || "—"}</dd><dt className="font-bold">Email</dt><dd>{order.customerEmail || "—"}</dd><dt className="font-bold">Phone</dt><dd>{order.customerPhone || address?.phone || "—"}</dd></dl></div>
        <div><h2 className="font-black">Fulfillment</h2><p className="mt-2 text-sm"><StatusBadge tone={order.fulfillmentStatus === "SHIPPED" ? "success" : order.fulfillmentStatus === "BLOCKED" ? "danger" : "warning"}>{order.fulfillmentStatus}</StatusBadge></p><p className="mt-2 text-sm">Assigned worker: {order.assignedFulfillmentUser?.name || order.assignedFulfillmentUser?.email || "Unassigned"}</p><p className="text-sm">Created: {fmt(order.createdAt)}</p><p className="text-sm">Shipped: {fmt(order.shippedAt)}</p></div>
        <div><h2 className="font-black">Handling notices</h2><ul className="mt-2 list-disc pl-5 text-sm"><li>Restricted item: {hasRestrictedItem ? "Yes" : "No"}</li><li>Payment collected required before shipment.</li><li>Confirm active reservation status before packing.</li></ul></div>
      </section>
      <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Items to pick</h2><table className="table"><thead><tr><th>Picked</th><th>Item</th><th>SKU</th><th>Qty</th><th>Restricted</th><th>Reservation status</th></tr></thead><tbody>{order.items.map((item: any) => { const reservations = item.variant?.inventory?.reservations?.filter((r: any) => r.orderItemId === item.id) ?? []; return <tr key={item.id}><td>☐</td><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{item.product?.restricted ? "Yes" : "No"}</td><td>{reservations.length ? reservations.map((r: any) => `${r.status} x${r.quantity}`).join(", ") : "No reservation"}</td></tr>; })}</tbody></table></section>
      <section className="card mt-4 p-5"><h2 className="font-black">Packing checklist</h2><ul className="mt-3 grid gap-2 text-sm"><li>☐ Verify payment has been collected and fulfillment status is released.</li><li>☐ Match SKU and quantity to the order.</li><li>☐ Verify restricted-product handling requirements.</li><li>☐ Confirm active reservations are present for every item.</li><li>☐ Pack items securely.</li><li>☐ Enter carrier and tracking before confirming shipment.</li></ul></section>
    </AdminShell>
  );
}
