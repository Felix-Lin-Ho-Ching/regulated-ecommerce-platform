import type { AdminSession } from "@/lib/admin/auth";
import type { FulfillmentOrderForAdmin } from "@/lib/fulfillment/admin-queries";
import { StatusBadge } from "@/components/ui";

function formatCreatedAt(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusTone(status: string) {
  if (status === "SHIPPED") {
    return "success";
  }

  if (status === "BLOCKED") {
    return "danger";
  }

  return "warning";
}

export function FulfillmentOrderRow({
  admin,
  order,
}: {
  admin: AdminSession;
  order: FulfillmentOrderForAdmin;
}) {
  const canShip =
    admin.role !== "FULFILLMENT" || order.assignedFulfillmentUserId === admin.adminId;
  const customer = order.customerName || order.customerEmail || "—";
  const shipTo = order.shippingAddress
    ? `${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
    : "—";
  const assignedEmployee =
    order.assignedFulfillmentUser?.name || order.assignedFulfillmentUser?.email || "Unassigned";

  return (
    <tr>
      <td>
        {canShip ? <input type="checkbox" name="orderIds" value={order.id} /> : null}
      </td>
      <td className="font-bold">{order.orderNumber}</td>
      <td>{formatCreatedAt(order.createdAt)}</td>
      <td>{customer}</td>
      <td>{shipTo}</td>
      <td>
        {order.items.map((item) => (
          <div key={item.id}>
            {item.name}
            <br />
            <span className="text-xs">
              SKU {item.sku} · Qty {item.quantity}
            </span>
            {item.restricted ? (
              <p className="text-xs font-bold text-amber-700">
                Restricted: verify compliant handling.
              </p>
            ) : null}
          </div>
        ))}
      </td>
      <td>{assignedEmployee}</td>
      <td>
        <StatusBadge tone={getStatusTone(order.fulfillmentStatus)}>
          {order.fulfillmentStatus}
        </StatusBadge>
      </td>
    </tr>
  );
}
