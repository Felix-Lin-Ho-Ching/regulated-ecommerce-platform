export type AdminNewOrderInput = { orderNumber: string; customerEmail?: string | null; totalCents: number; hasRestrictedItems: boolean; shippingState?: string | null; shippingPostalCode?: string | null; adminOrderUrl: string };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export function buildAdminNewOrderEmail(input: AdminNewOrderInput) {
  return {
    subject: `New order request ${input.orderNumber}`,
    text: `New order request. Status: Ready for payment. Payment status: Payment not collected. Fulfillment status: Fulfillment not released.\n\nOrder: ${input.orderNumber}\nCustomer email: ${input.customerEmail ?? "Not provided"}\nTotal: ${money(input.totalCents)}\nRestricted item: ${input.hasRestrictedItems ? "Yes" : "No"}\nState: ${input.shippingState ?? "--"}\nZIP: ${input.shippingPostalCode ?? "--"}\nAdmin link: ${input.adminOrderUrl}`,
  };
}
