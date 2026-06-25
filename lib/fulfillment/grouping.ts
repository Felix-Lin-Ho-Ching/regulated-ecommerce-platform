export type FulfillmentGroupName = "Today" | "Yesterday" | "This week" | "Older";

const groupNames: FulfillmentGroupName[] = ["Today", "Yesterday", "This week", "Older"];

export function getFulfillmentGroupName(date: Date): FulfillmentGroupName {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDate = new Date(date);

  if (orderDate >= todayStart) {
    return "Today";
  }

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (orderDate >= yesterdayStart) {
    return "Yesterday";
  }

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  if (orderDate >= weekStart) {
    return "This week";
  }

  return "Older";
}

export function groupFulfillmentOrdersByDate<T extends { createdAt: Date }>(
  orders: T[],
): Array<{ name: FulfillmentGroupName; orders: T[] }> {
  return groupNames
    .map((name) => ({
      name,
      orders: orders.filter((order) => getFulfillmentGroupName(order.createdAt) === name),
    }))
    .filter((group) => group.orders.length > 0);
}
