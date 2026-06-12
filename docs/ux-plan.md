# UX Plan: Stun Fry Restricted-Product Storefront

## Phase 2A direction

Stun Fry is now positioned as a shopper-facing ecommerce storefront for self-defense and safety products. The experience should feel like a real shop while keeping restricted-product compliance visible before cart, eligibility review, and payment.

## Storefront

- Home page presents a product-focused hero, featured product cards, category cards, trust badges, and clear calls to action.
- Product listing page keeps catalog data connected to the existing catalog service and presents grid cards with stock, price, brand, restricted badges, view actions, and add-to-cart actions.
- Product detail pages include large image space, SKU, brand, price, quantity selector, product features, restricted-product notice, cart action, and checkout action.

## Checkout

Customer-facing checkout is a five-step flow:

1. Cart
2. Shipping
3. Eligibility
4. Payment
5. Confirmation

Internal checks such as address validation, compliance rules, document requirements, provider rules, risk rules, and admin exceptions are grouped under Eligibility so the shopper flow remains understandable.

## Compliance and payment expectations

- Restricted-product warnings stay visible throughout shopping and checkout.
- Payment remains unavailable until eligibility approval.
- Payment, verification, document uploads, and admin decisions remain mocked in this phase.
- No live checkout, real payment provider, or external API is connected.

## Admin

Admin pages remain functional for compliance, verification, rule coverage, audits, launch gates, and supporting operations. Phase 2A only updates visible branding to Stun Fry and does not redesign the admin experience.
