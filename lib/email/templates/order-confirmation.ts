type Line = { name: string; sku: string; quantity: number; unitPriceCents: number };
type Address = { name: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string };
export type OrderConfirmationInput = { orderNumber: string; createdAt: Date; items: Line[]; totalCents: number; shippingAddress: Address; hasRestrictedItems: boolean };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export function buildOrderConfirmationEmail(input: OrderConfirmationInput) {
  const itemLines = input.items.map((item) => `- ${item.quantity} × ${item.name} (${item.sku}) at ${money(item.unitPriceCents)} each`).join("\n");
  const address = [input.shippingAddress.name, input.shippingAddress.line1, input.shippingAddress.line2, `${input.shippingAddress.city}, ${input.shippingAddress.state} ${input.shippingAddress.postalCode}`, input.shippingAddress.country ?? "US"].filter(Boolean).join("\n");
  const restricted = input.hasRestrictedItems ? "\n\nThis order request includes restricted item(s). Destination and age eligibility checks passed automatically before the request was created." : "";
  return {
    subject: `Your order request ${input.orderNumber} was received`,
    text: `Your order request has been received and eligibility checks passed automatically. Payment has not been collected, and fulfillment has not been released.\n\nOrder: ${input.orderNumber}\nDate: ${input.createdAt.toISOString()}\n\nItems:\n${itemLines}\n\nTotal: ${money(input.totalCents)}\n\nShipping address:\n${address}${restricted}\n\nNo payment has been collected online for this order request. It is ready for a future payment step.`,
  };
}
