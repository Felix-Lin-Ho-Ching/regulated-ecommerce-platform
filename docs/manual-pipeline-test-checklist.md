# Manual pipeline test checklist

Use this checklist after `npm run pipeline:test` passes. The smoke test catches backend state and database gate regressions; this checklist keeps manual testing focused on UI, copy, navigation, and real-user confidence.

## Preflight

- [ ] Run database migrations and seed data for the target environment.
- [ ] Run `npm run pipeline:test` and confirm it passes before opening the browser.
- [ ] Confirm launch gates still reflect the intended safe/manual posture for the environment.
- [ ] Confirm test inventory exists for at least one unrestricted product and one restricted product.
- [ ] Confirm staff credentials are available for owner/admin and fulfillment roles.

## Buyer flow

- [ ] Visit the storefront home page and confirm compliance/availability messaging is visible.
- [ ] Browse products and confirm restricted items clearly show availability/eligibility guidance.
- [ ] Add an unrestricted product to cart and verify quantity/subtotal updates.
- [ ] Add a restricted product only in an allowed test scenario, then verify age attestation and address checks are presented.
- [ ] Complete checkout with a valid shipping address.
- [ ] Confirm the success page communicates order-request status, payment-not-collected status, and fulfillment-not-released status.
- [ ] Confirm customer-facing order history/detail pages do not show shipment details before shipment.

## Owner/admin review flow

- [ ] Log in as owner/admin.
- [ ] Find the submitted order in the admin order list by order number, email, or customer name.
- [ ] Confirm the order detail shows shipping address, item lines, latest payment attempt, fulfillment hold, audit history, and notification logs.
- [ ] Confirm generic status actions cannot manually mark unpaid orders as paid, fulfilled, or shipped.
- [ ] If the order should be cancelled, use the dedicated cancellation action and verify reservations are released.
- [ ] If the order should proceed, use the approved payment/release procedure for the current iteration/environment.
- [ ] Confirm released orders show paid status and ready-to-ship fulfillment state before fulfillment staff can ship.

## Fulfillment flow

- [ ] Log in as a fulfillment user.
- [ ] Confirm unpaid or unreleased orders are not available for shipment.
- [ ] Claim a ready-to-ship order or use the assigned order already created by owner/admin release.
- [ ] Attempt to submit shipment without carrier/tracking and confirm validation blocks it.
- [ ] Submit valid carrier and tracking details.
- [ ] Confirm the order leaves the fulfillment queue or appears as shipped.
- [ ] Confirm inventory on-hand decreases, reserved quantity releases, and reservations are consumed.

## Post-shipment verification

- [ ] Re-open the admin order detail and confirm status is shipped, fulfillment status is shipped, carrier/tracking are recorded, and shipment audit logs exist.
- [ ] Re-open the customer order detail and confirm shipment status plus carrier/tracking are visible only after shipment.
- [ ] Confirm customer and internal shipment notifications are logged in the debug email log.
- [ ] Confirm a second shipment attempt skips the already-shipped order rather than decrementing inventory again.

## Notes for manual testers

- Do not use the smoke script as a replacement for browser testing.
- Record any UI confusion, missing copy, or broken navigation even when backend state is correct.
- If the smoke script fails, fix backend/data-state issues before continuing manual testing.
