# Stun Fry Storefront Review Guide

## Customer review path
1. Start at `/` for the premium compliance-first storefront positioning.
2. Open `/products` and `/products/arcguard-knuckle-stun-device` to inspect restricted-product notices for `knuckle_stun_device`.
3. Open `/cart` to confirm restricted item messaging appears before checkout.
4. Open `/checkout` to review the five-step checkout entry point: allowed, blocked, pending admin review, pending document upload, ready for payment, payment failed, and paid.
5. Open `/checkout/address`, `/checkout/verification?case=blocked`, `/checkout/verification?case=pending_admin_review`, `/checkout/verification?case=pending_document_upload`, `/checkout/document-upload`, and `/checkout/payment` to inspect eligibility, document, and payment states.
6. Open `/checkout/success` and `/checkout/failed` to validate payment outcome states.
7. Open `/account`, `/account/orders`, `/account/orders/SF-1004`, and `/account/addresses` to inspect customer status tracking.
8. Open `/terms`, `/privacy`, `/shipping-policy`, `/returns-policy`, and `/restricted-products-policy` to confirm policy route coverage.

## Admin review path
1. Start at `/admin` for the table-first dashboard.
2. Review `/admin/products`, `/admin/products/new`, and `/admin/products/p3` for restricted catalog management.
3. Review `/admin/inventory` for stock adjustment reason capture.
4. Review `/admin/orders`, `/admin/orders/SF-1003`, `/admin/verification-queue`, and `/admin/document-review` for manual review workflow and required notes.
5. Review `/admin/compliance-rules`, `/admin/verification-templates`, and `/admin/rule-coverage` for rules and coverage.
6. Review `/admin/launch-gates` for owner-only blocked, ready, and enabled gates.
7. Review `/admin/audit-log` and `/admin/backups` for operational controls.
8. Review settings placeholders: `/admin/coupons`, `/admin/members`, `/admin/admin-users`, `/admin/payment-settings`, `/admin/tax-settings`, `/admin/address-validation`, `/admin/risk-rules`, `/admin/notifications`, and `/admin/legal-policies`.

## Mock/stubbed items
- Product catalog data comes from the existing catalog service with fallback mock data when the database is unavailable.
- Uploads, address validation, payment redirect, refunds, notes, confirmations, exports, tax, and notification settings are non-persistent UI placeholders.
- Legal/compliance content is workflow-only mock content and requires counsel approval before production.
- Payment, checkout approval, document uploads, identity verification, external providers, and rule-engine integrations remain mocked.
