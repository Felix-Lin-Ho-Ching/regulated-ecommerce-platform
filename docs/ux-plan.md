# UX Plan: Restricted-Product Ecommerce Prototype

## 1. Sitemap
- Storefront: Home, products, product detail, cart, checkout, account, legal policies.
- Checkout: cart review, shipping address, address validation, compliance/verification, document upload, payment redirect, success, failed.
- Account: dashboard, order history, order detail, saved addresses.
- Admin: dashboard, products, inventory, orders, verification queue, document review, compliance rules, templates, rule coverage, launch gates, audit logs, backups, settings.

## 2. Route map
Customer routes: `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/checkout/address`, `/checkout/verification`, `/checkout/document-upload`, `/checkout/payment`, `/checkout/success`, `/checkout/failed`, `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/terms`, `/privacy`, `/shipping-policy`, `/returns-policy`, `/restricted-products-policy`.
Admin routes: `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/inventory`, `/admin/orders`, `/admin/orders/[id]`, `/admin/verification-queue`, `/admin/document-review`, `/admin/compliance-rules`, `/admin/verification-templates`, `/admin/rule-coverage`, `/admin/coupons`, `/admin/members`, `/admin/admin-users`, `/admin/payment-settings`, `/admin/tax-settings`, `/admin/address-validation`, `/admin/risk-rules`, `/admin/notifications`, `/admin/legal-policies`, `/admin/launch-gates`, `/admin/audit-log`, `/admin/backups`.

## 3. Customer shopping flow
Home introduces a serious compliance-first marketplace, product listing allows filtering restricted products, product detail provides eligibility notices, cart summarizes restricted-product impacts, checkout verifies shipping eligibility before payment.

## 4. Restricted product warning flow
Restricted badges appear on listing, detail, cart, and checkout. The warning explains legal restrictions, state rules, identity/document checks, and that payment is not collected until eligibility is cleared.

## 5. Checkout flow
Stepper: Cart review → Shipping address → Address validation → Compliance and verification → Required documents → Coupon and totals → Hosted payment redirect → Confirmation. Mock panels expose allowed, blocked, pending review, document required, ready for payment, failed, and paid states.

## 6. Address validation flow
Customer enters address, system normalizes the address, shows deliverability, identifies state/county impacts, and lets the customer confirm or edit. Undeliverable addresses stop checkout before compliance review.

## 7. State/compliance decision flow
Mock rules evaluate product category, destination state, destination county/city, purchaser age, and verification requirements. Outcomes: allowed, blocked with reason, pending admin review, pending document upload, or ready for payment.

## 8. Buyer verification flow
Customer confirms age, identity attributes, restricted-product acknowledgements, and agrees to truthful submission. Admin can see verification status and decision reasons.

## 9. Document upload flow
If required, customer sees required document type, acceptable formats, privacy retention note, upload drop zone, review status, and no payment button until approval.

## 10. Manual review flow
Pending orders enter admin queues. Reviewers inspect order context, address validation, rule result, verification checklist, and documents, then approve/reject with required notes.

## 11. Ready-for-payment flow
After eligibility approval, customer sees finalized order summary, payment amount, compliance status, and a button to leave for hosted payment. Copy states no card data is collected by the prototype/store page.

## 12. Payment redirect placeholder flow
Payment page shows hosted payment handoff, payload summary, mock processor state, and links to success or failed pages for prototype testing.

## 13. Order status flow
Order timeline displays verification, document review, payment, fulfillment, and shipping states with text labels so status is not color-only.

## 14. Admin product flow
Table-first product list with search/status/category filters, restricted badge, edit details, add new product shell, confirmation for deactivate/archive actions.

## 15. Admin inventory flow
Inventory table shows SKU, available/reserved stock, restricted status, reorder threshold, last adjustment, and adjustment dialog requiring reason.

## 16. Admin compliance rule flow
Rules list by jurisdiction/product category/outcome. Changes require note, effective date, owner/reviewer visibility, and audit log entries.

## 17. Admin verification template flow
Templates define required attestations/documents per product category and jurisdiction. Admins can preview customer-facing requirements and edit with notes.

## 18. Admin document review flow
Queue and detail screen show document type, upload age, order context, checklist, approve/reject actions requiring notes, and privacy/retention reminders.

## 19. Rule coverage dashboard flow
Matrix shows state-by-state coverage for restricted categories with covered, review needed, blocked, and missing-rule statuses plus launch blockers.

## 20. Owner launch gate flow
Launch gates aggregate policy, products, inventory, payment settings, tax, address validation, rule coverage, legal policies, and backups. Owner-only enable action remains blocked until all required gates are ready.

## 21. Component inventory
AppShell, StoreHeader, StoreFooter, ProductCard, ProductDetail, RestrictedProductBadge, CheckoutStepper, CheckoutSummary, ComplianceResultPanel, VerificationRequirementList, DocumentUploadCard, OrderStatusTimeline, AdminShell, AdminSidebar, AdminHeader, AdminDataTable, StatusBadge, RuleCoverageMatrix, LaunchGateCard, AuditLogTable, ConfirmDialog, EmptyState, AlertPanel, FormField, SectionHeader.
