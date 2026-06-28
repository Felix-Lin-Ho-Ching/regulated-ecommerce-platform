import { Fragment } from "react";
import type { AdminSession } from "@/lib/admin/auth";
import type { FulfillmentOrderForAdmin } from "@/lib/fulfillment/admin-queries";
import { groupFulfillmentOrdersByDate } from "@/lib/fulfillment/grouping";
import { FulfillmentOrderRow } from "@/components/admin/fulfillment/fulfillment-order-row";

export function FulfillmentOrdersTable({ admin, orders }: { admin: AdminSession; orders: FulfillmentOrderForAdmin[] }) {
  const groups = groupFulfillmentOrdersByDate(orders);

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead><tr><th><span className="sr-only">Select</span></th><th>Order</th><th>Customer</th><th>State/ZIP</th><th>Restricted</th><th>Item count</th><th>SKUs</th><th>Qty total</th><th>Fulfillment status</th><th>Assigned worker</th><th>Created</th><th>Shipped</th><th>Carrier/tracking</th></tr></thead>
        <tbody>{groups.map((group) => (<Fragment key={group.name}><tr><td colSpan={13} className="bg-slate-100 font-black">{group.name}</td></tr>{group.orders.map((order) => (<FulfillmentOrderRow key={order.id} admin={admin} order={order} />))}</Fragment>))}</tbody>
      </table>
      {!orders.length ? <p className="p-5 text-sm text-slate-600">No paid/released fulfillment orders match this view. Unpaid READY_FOR_PAYMENT order requests are intentionally hidden.</p> : null}
    </div>
  );
}
