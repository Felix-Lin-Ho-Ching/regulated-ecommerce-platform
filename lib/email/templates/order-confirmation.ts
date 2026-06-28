type Line = { name: string; sku: string; quantity: number; unitPriceCents: number };
type Address = { name: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string };
export type OrderConfirmationInput = { orderNumber: string; createdAt: Date; items: Line[]; totalCents: number; shippingAddress: Address; hasRestrictedItems: boolean };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export function buildOrderConfirmationEmail(input: OrderConfirmationInput) {
  const itemLines = input.items.map((item) => `- ${item.quantity} × ${item.name} (${item.sku}) at ${money(item.unitPriceCents)} each`).join("\n");
  const address = [input.shippingAddress.name, input.shippingAddress.line1, input.shippingAddress.line2, `${input.shippingAddress.city}, ${input.shippingAddress.state} ${input.shippingAddress.postalCode}`, input.shippingAddress.country ?? "US"].filter(Boolean).join("\n");
  const restricted = input.hasRestrictedItems ? "\nRestricted item: Yes" : "\nRestricted item: No";
  return {
    subject: `Your order request ${input.orderNumber} was received`,
    text: `Your order request was received and eligibility checks passed. Payment has not been collected. The next step is payment later, when payment integration is available. Fulfillment has not started and is not released.\n\nOrder: ${input.orderNumber}\nDate: ${input.createdAt.toISOString()}\nStatus: Ready for payment\nPayment status: Payment not collected\nFulfillment status: Fulfillment not released${restricted}\n\nItems:\n${itemLines}\n\nTotal: ${money(input.totalCents)}\n\nShipping address:\n${address}`,
  };
}
