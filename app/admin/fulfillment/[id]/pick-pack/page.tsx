import Link from "next/link";
import { AdminShell, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { SingleShipmentForm } from "@/components/admin/fulfillment/single-shipment-form";

const releasedOrderStatuses = ["PAID", "SHIPPED"];
const releasedFulfillmentStatuses = ["READY_TO_SHIP", "PICKING", "SHIPPED"];

const fmt = (date: Date | null) => date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date) : "—";

function isFulfillmentReleased(order: { status: string; fulfillmentStatus: string }) {
  return releasedOrderStatuses.includes(order.status) && releasedFulfillmentStatuses.includes(order.fulfillmentStatus);
}

function canViewPickPackOrder(
  admin: { adminId: string; role: string },
  order: { assignedFulfillmentUserId: string | null; fulfillmentStatus: string; status: string },
) {
  if (!isFulfillmentReleased(order)) {
    return false;
  }

  if (admin.role !== "FULFILLMENT") {
    return true;
  }

  return order.assignedFulfillmentUserId === admin.adminId || (order.assignedFulfillmentUserId === null && order.fulfillmentStatus === "READY_TO_SHIP");
}

function NotReleasedState() {
  return (
    <AdminShell title="Pick/pack" currentPath="/admin/fulfillment">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link className="btn btn-secondary" href="/admin/fulfillment">Back to fulfillment</Link>
      </div>
      <EmptyState title="Fulfillment is not released">
        Fulfillment is not released because payment has not been collected. Customer, shipping, item, SKU, and reservation details are hidden until payment collection releases the order for fulfillment.
      </EmptyState>
    </AdminShell>
  );
}

function AccessDeniedState() {
  return (
    <AdminShell title="Pick/pack" currentPath="/admin/fulfillment">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link className="btn btn-secondary" href="/admin/fulfillment">Back to fulfillment</Link>
      </div>
      <EmptyState title="Fulfillment order unavailable">
        This order is assigned to another fulfillment worker or is not available for you to claim.
      </EmptyState>
    </AdminShell>
  );
}

export default async function PickPackPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession("/admin/fulfillment");
  const { id } = await params;
  const orderAccess = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }], archivedAt: null },
    select: {
      id: true,
      status: true,
      fulfillmentStatus: true,
      assignedFulfillmentUserId: true,
    },
  });

  if (!orderAccess) return <AdminShell title="Pick/pack"><EmptyState title="Order not found">This fulfillment order could not be found.</EmptyState></AdminShell>;

  if (!isFulfillmentReleased(orderAccess)) {
    return <NotReleasedState />;
  }

  if (!canViewPickPackOrder(admin, orderAccess)) {
    return <AccessDeniedState />;
  }

  const order: any = await prisma.order.findUnique({
    where: { id: orderAccess.id },
    include: {
      shippingAddress: true,
      assignedFulfillmentUser: { select: { name: true, email: true } },
      items: { include: { product: { select: { restricted: true } }, variant: { include: { inventory: { include: { reservations: true } } } } } },
    },
  });

  if (!order) return <AdminShell title="Pick/pack"><EmptyState title="Order not found">This fulfillment order could not be found.</EmptyState></AdminShell>;

  const address = order.shippingAddress;
  const hasRestrictedItem = order.items.some((item: any) => item.product?.restricted);
  const canConfirmShipment = order.status === "PAID" && order.fulfillmentStatus === "PICKING" && !order.shippedAt && (admin.role !== "FULFILLMENT" || order.assignedFulfillmentUserId === admin.adminId);

  return (
    <AdminShell title={`Pick/pack ${order.orderNumber}`} currentPath="/admin/fulfillment">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden"><Link className="btn btn-secondary" href="/admin/fulfillment">Back to fulfillment</Link><span className="btn btn-primary">Use browser print</span></div>
      <SectionHeader eyebrow="Printable pick / pack" title={order.orderNumber}>Payment collected required before shipment. This view is operational only and does not release unpaid orders.</SectionHeader>
      <section className="card mt-4 grid gap-4 p-5 md:grid-cols-2">
        <div><h2 className="font-black">Ship to</h2><p className="mt-2 text-sm">{[address?.name, address?.line1, address?.line2, `${address?.city ?? ""}, ${address?.state ?? ""} ${address?.postalCode ?? ""}`, address?.country].filter(Boolean).join("\n") || "—"}</p></div>
        <div><h2 className="font-black">Customer contact</h2><dl className="mt-2 text-sm"><dt className="font-bold">Name</dt><dd>{order.customerName || address?.name || "—"}</dd><dt className="font-bold">Email</dt><dd>{order.customerEmail || "—"}</dd><dt className="font-bold">Phone</dt><dd>{order.customerPhone || address?.phone || "—"}</dd></dl></div>
        <div><h2 className="font-black">Fulfillment</h2><p className="mt-2 text-sm"><StatusBadge tone={order.fulfillmentStatus === "SHIPPED" ? "success" : order.fulfillmentStatus === "BLOCKED" ? "danger" : "warning"}>{order.fulfillmentStatus}</StatusBadge></p><p className="mt-2 text-sm">Assigned worker: {order.assignedFulfillmentUser?.name || order.assignedFulfillmentUser?.email || "Unassigned"}</p><p className="text-sm">Created: {fmt(order.createdAt)}</p><p className="text-sm">Shipped: {fmt(order.shippedAt)}</p><p className="text-sm">Carrier: {order.carrier || "—"}</p><p className="text-sm">Tracking: {order.trackingNumber || "—"}</p></div>
        <div><h2 className="font-black">Handling notices</h2><ul className="mt-2 list-disc pl-5 text-sm"><li>Restricted item: {hasRestrictedItem ? "Yes" : "No"}</li><li>Payment collected required before shipment.</li><li>Confirm active reservation status before packing.</li></ul></div>
      </section>
      <section className="card mt-4 p-5"><h2 className="font-black">Shipment confirmation</h2>{order.fulfillmentStatus === "SHIPPED" ? <p className="mt-2 text-sm text-emerald-800">Shipped via {order.carrier || "—"} / {order.trackingNumber || "—"}.</p> : canConfirmShipment ? <SingleShipmentForm orderId={order.id} /> : <p className="mt-2 text-sm text-slate-600">Claim this paid order before confirming shipment. Fulfillment staff can only ship orders assigned to them.</p>}</section>
      <section className="card mt-4 p-5"><h2 className="mb-3 font-black">Items to pick</h2><table className="table"><thead><tr><th>Picked</th><th>Item</th><th>SKU</th><th>Qty</th><th>Restricted</th><th>Reservation status</th></tr></thead><tbody>{order.items.map((item: any) => { const reservations = item.variant?.inventory?.reservations?.filter((r: any) => r.orderItemId === item.id) ?? []; return <tr key={item.id}><td>☐</td><td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{item.product?.restricted ? "Yes" : "No"}</td><td>{reservations.length ? reservations.map((r: any) => `${r.status} x${r.quantity}`).join(", ") : "No reservation"}</td></tr>; })}</tbody></table></section>
      <section className="card mt-4 p-5"><h2 className="font-black">Packing checklist</h2><ul className="mt-3 grid gap-2 text-sm"><li>☐ Verify payment has been collected and fulfillment status is released.</li><li>☐ Match SKU and quantity to the order.</li><li>☐ Verify restricted-product handling requirements.</li><li>☐ Confirm active reservations are present for every item.</li><li>☐ Pack items securely.</li><li>☐ Enter carrier and tracking before confirming shipment.</li></ul></section>
    </AdminShell>
  );
}
