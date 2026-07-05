# Stun Fry Current UX

Stun Fry uses a normal ecommerce shopping path. Customers browse products, add items to the cart, and complete a one-page checkout.

## Product and cart experience

- Restricted products display only: `Restricted item · Verified at checkout`.
- Product pages do not ask for state or ZIP eligibility.
- Product listings do not include compliance filters.
- The cart remains a standard ecommerce cart and shows a compact notice: `Restricted items are verified during checkout.`

## One-page checkout

Checkout contains the customer-facing decision point for restricted items:

1. Contact information.
2. Delivery address with United States as the fixed country/region.
3. Shipping method based on the entered shipping state and ZIP code.
4. Payment-form placeholders that do not collect, store, or send card data.
5. Age verification when the cart contains a restricted product.
6. Order summary with items, quantity, price, discount-code entry, subtotal, shipping, tax, and total.

Sales tax is calculated automatically during checkout from the customer shipping address using the configured tax provider. There is no manual admin tax settings page.

## Restricted item rules

- If the cart has no restricted product, age verification is not required.
- If the cart contains a restricted product, checkout requires state and ZIP before shipping and order submission can continue.
- A blocked destination shows: `This item is not available for your shipping destination.`
- Uncertain destination data shows: `Additional restrictions may apply.`
- Allowed destinations require the customer to verify age and confirm they are at least 18 years old before order submission.

## My State page

The My State page is informational only. It shows a simple YES/NO checklist for consumer use/possession and other restrictions. Checkout shipping destination checks make the final eligibility decision.

## Admin separation

Admin compliance screens remain available for store operations and are separate from public checkout UI.
