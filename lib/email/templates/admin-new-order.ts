export type AdminNewOrderInput = { orderNumber: string; customerEmail?: string | null; totalCents: number; hasRestrictedItems: boolean; shippingState?: string | null; shippingPostalCode?: string | null; adminOrderUrl: string };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export function buildAdminNewOrderEmail(input: AdminNewOrderInput) {
  return {
    subject: `New order ${input.orderNumber}`,
    text: `New order submitted.\n\nOrder: ${input.orderNumber}\nCustomer email: ${input.customerEmail ?? "Not provided"}\nTotal: ${money(input.totalCents)}\nRestricted items: ${input.hasRestrictedItems ? "Yes" : "No"}\nShip to: ${input.shippingState ?? "--"} ${input.shippingPostalCode ?? "--"}\nAdmin link: ${input.adminOrderUrl}`,
  };
}
