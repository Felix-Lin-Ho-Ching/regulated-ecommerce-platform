<!--
Complete master specification for the Stun Fry restricted-product ecommerce platform.
This file combines the uploaded master specification with the final hardening addendum.
Use this as docs/master-spec.md in the repository.
-->

# Stun Fry Master Specification

Source: `master specification.docx`.

Build a production-ready restricted-product ecommerce website for a United States self-defense product store.

The store brand is "Stun Fry"

The store sells restricted self-defense products. The first major product category is knuckle_stun_device. Treat this as a restricted product category, not a normal unrestricted ecommerce item.

This is not a one-product landing page.

## Build a real ecommerce platform with

- customer storefront
- product catalog
- cart
- checkout
- member account system
- coupon system
- inventory system
- admin dashboard
- Owner / Super Admin role
- admin role management
- compliance rules engine
- buyer eligibility verification engine
- document/manual review system
- payment adapter
- order system
- audit log
- database backup and restore safety
- state-rule coverage dashboard
- address validation
- tax provider adapter
- verification provider adapter
- policy and terms versioning
- production launch gates
- fraud and risk review rules
- transactional notification system
- shipping delay and refund workflow

## Primary development goal

Build the full system using mock payment first.

## Payment production target

- Primary payment technology: NMI Hosted Checkout
- Merchant/payment provider: PNC-approved merchant account
- Backup payment technology: Authorize.Net Accept Hosted
- Conditional provider only: Clover Hosted Checkout, only if written approval specifically confirms ecommerce stun-gun sales through Clover/Fiserv

Do not launch live payments yet.

Do not use production credentials yet.

Do not invent legal claims.

Do not invent payment API endpoints.

Do not collect or store raw card numbers.

Do not store CVV.

Do not build a custom raw-card form unless explicitly required later by the approved gateway.

## Use

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- Playwright
- Payment adapter pattern

## Project structure

- app/(store)
- app/(checkout)
- app/(account)
- app/(admin)
- components/ui
- components/store
- components/checkout
- components/admin
- components/forms
- components/compliance
- components/verification
- components/address
- components/tax
- components/notifications
- lib/payments
- lib/compliance
- lib/verification
- lib/address
- lib/tax
- lib/inventory
- lib/audit
- lib/backup
- lib/notifications
- lib/risk
- prisma
- scripts
- tests/e2e

## Payment architecture

## Create

- lib/payments/payment-provider.ts
- lib/payments/mock-provider.ts
- lib/payments/nmi-provider.ts
- lib/payments/authorize-net-provider.ts
- lib/payments/clover-provider.ts

## Payment provider interface must support

- createCheckoutSession
- confirmPayment
- refundPayment
- voidPayment
- handleWebhook
- verifyWebhookSignature

## Environment variables

- PAYMENT_PROVIDER=mock
- NMI_API_BASE_URL=
- NMI_SECURITY_KEY=
- NMI_WEBHOOK_SECRET=
- AUTHORIZE_NET_API_LOGIN_ID=
- AUTHORIZE_NET_TRANSACTION_KEY=
- AUTHORIZE_NET_SIGNATURE_KEY=
- CLOVER_MERCHANT_ID=
- CLOVER_PRIVATE_TOKEN=
- CLOVER_WEBHOOK_SECRET=
- APP_BASE_URL=
- DATABASE_URL=
- NODE_ENV=
- LIVE_CHECKOUT_ENABLED=false
- LIVE_PAYMENTS_ENABLED=false
- LIVE_FULFILLMENT_ENABLED=false

## Payment provider behavior

- mock-provider.ts must support success, failure, expired, cancelled, and pending simulation.
- nmi-provider.ts should be structured for NMI Hosted Checkout but must not invent undocumented endpoints.
- authorize-net-provider.ts should be structured for Authorize.Net Accept Hosted but must not invent undocumented endpoints.
- clover-provider.ts should remain conditional only.
- Payment provider must be switchable by PAYMENT_PROVIDER environment variable.
- Development default is PAYMENT_PROVIDER=mock.
- Do not create real payment sessions when compliance or verification is blocked.
- Do not create real payment sessions when order status is pending_admin_review or pending_document_upload.
- Never allow live payment if PAYMENT_PROVIDER=mock.
- Payment amount must equal final order grand_total.

## Payment flow

1. Customer adds product to cart.
2. Customer enters shipping address.
3. Website validates and normalizes shipping address.
4. Website calculates tax using mock tax provider during development.
5. Website selects state, local, product-feature, carrier, payment-provider, risk, and buyer-verification rules.
6. Website calculates final compliance decision.
7. Website calculates required verification steps.
8. If blocked, do not create payment session.
9. If manual_review, create pending_admin_review order and do not collect payment.
10. If document upload is required, create pending_document_upload order and do not collect payment unless rule explicitly allows it.
11. If allowed and verification is complete, reserve inventory.
12. Create hosted checkout session with selected payment provider.
13. Redirect customer to hosted payment page.
14. Receive redirect and webhook.
15. Verify webhook signature.
16. Mark order paid only after verified payment result.
17. Confirm stock reduction after successful payment.
18. Release reserved stock after failed, cancelled, expired, or declined payment.
19. Make webhook handling idempotent so duplicate webhooks cannot double-charge, double-refund, or double-reduce stock.

## Core customer pages

- Home page
- Product listing page
- Product detail page
- Cart page
- Checkout page
- Account signup page
- Account login page
- Member account dashboard
- Order history page
- Saved addresses page
- Document upload page
- Verification status page
- Order success page
- Order failed page
- Terms page
- Privacy policy page
- Shipping policy page
- Returns policy page
- Restricted products policy page

## Product system

## Create models

- Product
- ProductVariant
- ProductImage
- ProductCategory
- ProductComplianceCategory
- ProductFeature

## Product fields

- id
- name
- slug
- description
- short_description
- sku
- price
- sale_price
- status: draft, active, archived
- product_category_id
- compliance_category
- restricted_product: boolean
- created_at
- updated_at
- archived_at

## ProductVariant fields

- id
- product_id
- sku
- option_name
- option_value
- price_override
- inventory_id
- status: active, archived
- created_at
- updated_at

## ProductImage fields

- id
- product_id
- url
- alt_text
- sort_order
- created_at

## ProductFeature values

- electric_contact_device
- projectile_electric_device
- knuckle_grip
- metallic_knuckle_shape
- plastic_knuckle_shape
- concealed_blade
- pepper_spray
- baton
- alarm_only
- flashlight_only

## Important product rule

A product can have multiple restricted features.

If a product has multiple restricted features, evaluate every feature.

## Example

## A knuckle_stun_device must be evaluated as

- electric_contact_device
- knuckle_grip
- metallic_knuckle_shape or plastic_knuckle_shape if applicable

## Use the strictest final result

- blocked overrides manual_review
- manual_review overrides allowed

## Product compliance categories

- direct_contact_stun_gun
- projectile_electronic_dart_device
- knuckle_stun_device
- self_defense_spray
- other_restricted_self_defense_device

## Inventory system

## Create models

- Inventory
- InventoryTransaction
- InventoryReservation

## Inventory behavior

- Admin can add stock.
- Admin can reduce stock.
- Admin can correct stock.
- Admin must provide a reason when changing stock.
- Checkout reserves stock before payment.
- Failed payment releases reserved stock.
- Cancelled checkout releases reserved stock.
- Expired payment releases reserved stock.
- Successful payment confirms stock reduction.
- Out-of-stock products cannot be purchased.
- Low-stock products appear in admin dashboard.
- Every stock change creates an InventoryTransaction.
- InventoryTransaction must store admin/user/system actor, reason, old quantity, new quantity, and timestamp.

## Membership system

## Create membership tiers

- Guest
- Member
- VIP
- Wholesale
- Admin

## Membership features

- User signup
- User login
- Order history
- Saved addresses
- Member-only coupons
- Member-only discounts
- Admin can change user membership tier
- Owner can manage admin users

## Coupon system

## Create models

- Coupon
- CouponRedemption

## Coupon fields

- id
- code
- discount_type: percentage, fixed_amount, free_shipping
- discount_value
- minimum_order_amount
- maximum_total_uses
- maximum_uses_per_customer
- first_order_only
- member_only
- required_membership_tier
- product_specific
- category_specific
- cannot_combine
- start_date
- expiry_date
- status: active, disabled, expired
- created_at
- updated_at

## Coupon behavior

- Valid coupon applies discount.
- Invalid coupon is rejected.
- Expired coupon is rejected.
- Disabled coupon is rejected.
- Member-only coupon is rejected for non-member.
- First-order-only coupon is rejected if customer already has an order.
- Maximum-use coupon is rejected after limit.
- Coupon use creates CouponRedemption.
- Coupon discount must be recorded on Order.

## Admin role system

## Create admin roles

- Owner
- Admin Manager
- Compliance Admin
- Verification Admin
- Product Admin
- Inventory Admin
- Order Admin
- Support Admin
- Read-only Admin

## Owner permissions

- Can do everything.
- Can invite admins.
- Can deactivate admins.
- Can change admin roles.
- Can manage payment settings.
- Can manage database backups.
- Can view all audit logs.
- Can change production safety settings.
- Can approve production launch settings.
- Can enable or disable live checkout.
- Can enable or disable live payments.
- Can enable or disable live fulfillment.

## Admin safety

- Do not hard-delete admin accounts.
- Deactivate admin accounts instead.
- No admin can delete the Owner account.
- No admin can remove the final Owner account.
- Every admin action must be recorded in AuditLog.
- Add database structure for two-factor authentication readiness.
- Require Owner permission for payment settings, backup/export, admin role changes, and production safety settings.

## Admin dashboard

## Create

- Dashboard overview
- Product manager
- Inventory manager
- Coupon manager
- Membership manager
- User manager
- Admin user manager
- Order manager
- Refund manager
- Compliance rule manager
- Buyer verification rule manager
- Verification template manager
- Buyer document review queue
- Payment provider settings
- Audit log viewer
- Database backup/export page
- Rule coverage dashboard
- Address validation settings
- Tax provider settings
- Verification provider settings
- Legal policy manager
- Launch gate manager
- Risk rule manager
- Notification template manager
- Shipping delay manager

## Admin UX

- Table-first dashboard.
- Filters, search, and status badges.
- Dangerous actions require confirmation dialog.
- Rule changes require notes.
- Stock changes require reason.
- Refunds require reason.
- Admin role changes require Owner permission.
- Backup/export actions require Owner permission.
- Show audit log entries clearly.
- Do not use permanent delete buttons for products, coupons, admin users, users, orders, or compliance rules.
- Use archive, disable, deactivate, cancel, or refund instead.

## Compliance system

Do not hard-code legal rules.

## The compliance system must answer

1. Can this product be sold to this shipping location?
2. Can this product be shipped by this carrier?
3. Can this payment provider be used for this product?
4. Does the product contain restricted features that trigger extra checks?
5. What buyer verification is required?
6. When must that verification happen?
7. Is payment allowed before verification is complete?
8. Is fulfillment allowed before verification is complete?

## Create models

- StateRestrictionRule
- LocalRestrictionRule
- CarrierRestrictionRule
- PaymentProviderRestrictionRule
- ProductFeatureRestrictionRule
- RestrictionRuleVersion
- OrderRestrictionSnapshot
- ComplianceAuditLog

## StateRestrictionRule fields

- id
- state
- product_category
- status: allowed, blocked, manual_review
- minimum_age
- permit_required
- seller_license_required
- background_check_required
- local_vendor_required
- shipping_allowed
- payment_allowed
- verification_template_id
- notes
- source_name
- source_url
- statute_reference
- effective_date
- last_reviewed_at
- last_reviewed_by
- verification_status: missing, unverified, internally_reviewed, attorney_reviewed, provider_approved
- active_version_id
- created_at
- updated_at

## LocalRestrictionRule fields

- id
- state
- city
- county
- zip_code
- product_category
- status: allowed, blocked, manual_review
- minimum_age
- verification_template_id
- notes
- source_name
- source_url
- statute_reference
- effective_date
- last_reviewed_at
- verification_status
- created_at
- updated_at

## CarrierRestrictionRule fields

- id
- carrier_name
- product_category
- state
- city
- zip_code
- status: allowed, blocked, contract_required, manual_review
- notes
- last_reviewed_at
- created_at
- updated_at

## PaymentProviderRestrictionRule fields

- id
- provider_name
- product_category
- status: approved, blocked, manual_review
- approved_descriptor
- approved_mcc
- monthly_processing_limit
- reserve_requirement
- approval_document_reference
- notes
- last_reviewed_at
- created_at
- updated_at

## ProductFeatureRestrictionRule fields

- id
- product_feature
- product_compliance_category
- state
- county
- city
- zip_code
- status: allowed, blocked, manual_review
- verification_template_id
- notes
- source_name
- source_url
- statute_reference
- verification_status
- effective_date
- last_reviewed_at
- created_at
- updated_at

## Restriction rule behavior

- Unknown state defaults to manual_review.
- Unknown local rule defaults to the state rule.
- Unknown product feature rule defaults to manual_review.
- knuckle_stun_device defaults to manual_review in all states until verified.
- Admin can change minimum age without code change.
- Admin can change a state from allowed to blocked without code change.
- Admin can require permit/manual review for specific states.
- Admin can update carrier restriction rules.
- Admin can update payment provider restriction rules.
- Old rule versions must never be deleted.
- Each order saves the exact rule snapshot used at checkout.
- Checkout must use the latest active rule version.
- Rule changes require admin note.
- Rule changes create RestrictionRuleVersion.
- Rule decisions create ComplianceAuditLog.

## State-rule coverage requirement

Seed all 50 U.S. states plus District of Columbia.

## Every state must have rule coverage for each restricted product compliance category

- direct_contact_stun_gun
- projectile_electronic_dart_device
- knuckle_stun_device
- self_defense_spray
- other_restricted_self_defense_device

Create rule coverage models or fields that let admin see whether each state/product category has:

- StateRestrictionRule
- StateVerificationRule
- ProductFeatureRestrictionRule
- CarrierRestrictionRule
- PaymentProviderRestrictionRule

## Default behavior

- If a state rule is missing, checkout must become manual_review.
- If a product feature rule is missing, checkout must become manual_review.
- If a verification rule is missing, checkout must become manual_review.
- If a carrier rule is missing, checkout must become manual_review.
- If a payment-provider rule is missing, checkout must become manual_review.
- Do not allow a restricted-product checkout to silently pass because a rule is missing.

## Create an admin Rule Coverage Dashboard showing

- state
- product compliance category
- restriction rule status
- verification rule status
- product feature rule status
- carrier rule status
- payment provider rule status
- verification_status: missing, unverified, internally_reviewed, attorney_reviewed, provider_approved
- last_reviewed_at
- last_reviewed_by

## Add coverage filters

- show missing rules
- show unverified rules
- show attorney-reviewed rules
- show provider-approved rules
- show rules expiring soon
- show stale rules not reviewed within configurable number of days

## Buyer eligibility verification engine

The system must not only check whether a state is allowed or blocked.

It must also determine what verification is required before checkout, before payment, and before fulfillment.

## Core rule

Shipping address selects the applicable jurisdiction rule.

The selected rule determines the required verification steps.

Do not hard-code buyer verification rules in checkout code.

All verification rules must be editable from admin.

## Create models

- VerificationTemplate
- VerificationRequirement
- StateVerificationRule
- LocalVerificationRule
- BuyerVerificationRecord
- BuyerVerificationDocument
- OrderVerificationSnapshot
- VerificationAuditLog

## VerificationTemplate fields

- id
- code
- name
- description
- default_decision: allowed, blocked, manual_review
- minimum_age
- requires_age_gate
- requires_age_attestation
- requires_date_of_birth
- requires_government_id
- requires_third_party_age_verification
- requires_selfie_liveness_check
- requires_legal_eligibility_attestation
- requires_permit_upload
- permit_type
- requires_foid_card
- requires_concealed_carry_permit
- requires_firearm_identification_card
- requires_license_to_carry
- requires_background_check
- requires_safety_briefing_confirmation
- requires_parental_consent
- requires_seller_license
- requires_local_vendor
- requires_manual_review
- waiting_period_hours
- record_retention_years
- payment_timing
- verification_timing
- shipment_allowed_before_review
- created_at
- updated_at

## verification_timing enum

- product_view
- cart
- checkout
- before_payment
- after_order_before_payment
- after_payment_before_fulfillment
- before_fulfillment

## payment_timing enum

- no_payment_allowed
- payment_after_verification_only
- authorize_before_verification_capture_after_approval
- collect_payment_then_hold_fulfillment

## Default safe payment behavior

- blocked = no order and no payment
- manual_review = create pending_admin_review order and do not collect payment
- permit_required = create pending_document_upload order and do not collect payment
- FOID_required = create pending_document_upload order and do not collect payment
- seller_license_required = create pending_admin_review order and do not collect payment
- background_check_required = create pending_admin_review order and do not collect payment
- local_vendor_required = create pending_admin_review order and do not collect payment
- simple_allowed = collect payment only after required age/legal attestation
- unknown = manual_review and no payment

## VerificationRequirement fields

- id
- template_id
- step_key
- step_label
- step_description
- required_before: product_view, cart, checkout, payment, fulfillment
- evidence_type: checkbox, date_of_birth, government_id, permit_upload, foid_upload, license_upload, third_party_result, admin_review, legal_attestation, background_check_result, safety_briefing_confirmation
- is_required
- sort_order

## StateVerificationRule fields

- id
- state
- product_compliance_category
- verification_template_id
- minimum_age
- status: allowed, blocked, manual_review
- notes
- source_name
- source_url
- statute_reference
- verification_status: missing, unverified, internally_reviewed, attorney_reviewed, provider_approved
- effective_date
- last_reviewed_at
- created_at
- updated_at

## LocalVerificationRule fields

- id
- state
- county
- city
- zip_code
- product_compliance_category
- verification_template_id
- minimum_age
- status: allowed, blocked, manual_review
- notes
- source_name
- source_url
- statute_reference
- verification_status
- effective_date
- last_reviewed_at
- created_at
- updated_at

## BuyerVerificationRecord fields

- id
- user_id
- order_id
- state
- county
- city
- zip_code
- product_compliance_category
- verification_template_id
- status: not_started, pending, passed, failed, expired, manual_review
- age_attested
- date_of_birth_provided
- calculated_age
- legal_eligibility_attested
- government_id_check_status
- third_party_verification_provider
- third_party_verification_reference
- permit_check_status
- foid_check_status
- concealed_carry_permit_check_status
- firearm_identification_card_check_status
- license_to_carry_check_status
- background_check_status
- safety_briefing_status
- parental_consent_status
- admin_review_status
- reviewed_by_admin_id
- reviewed_at
- failure_reason
- expires_at
- created_at
- updated_at

## BuyerVerificationDocument fields

- id
- buyer_verification_record_id
- document_type
- document_status: pending, accepted, rejected, expired
- storage_reference
- uploaded_at
- reviewed_by_admin_id
- reviewed_at
- rejection_reason
- expires_at

## Identity/document security

- Do not store raw identity documents unless absolutely required.
- Prefer third-party age/identity verification.
- If documents must be uploaded, store them securely.
- Restrict document access to authorized admins.
- Log every document view.
- Log every document download.
- Support retention and deletion workflow according to policy.
- Never expose document URLs publicly.
- Do not send identity documents through normal email.

## OrderVerificationSnapshot fields

- id
- order_id
- shipping_state
- shipping_county
- shipping_city
- shipping_zip
- product_compliance_category
- product_features_checked
- state_rule_snapshot
- local_rule_snapshot
- product_feature_rule_snapshot
- carrier_rule_snapshot
- payment_provider_rule_snapshot
- verification_template_snapshot
- required_verification_steps_snapshot
- buyer_verification_result_snapshot
- address_validation_snapshot
- tax_calculation_snapshot
- risk_assessment_snapshot
- required_policy_versions
- compliance_decision
- verification_decision
- risk_decision
- payment_allowed
- fulfillment_allowed
- required_documents
- final_decision: allowed, blocked, manual_review
- decision_reason
- created_at

## VerificationAuditLog fields

- id
- actor_type: customer, admin, system
- actor_id
- order_id
- user_id
- event_type
- event_data
- created_at

## Create these reusable verification templates

1. AGE_18_ATTESTATION_ONLY
   - minimum_age: 18
   - requires_age_gate: true
   - requires_age_attestation: true
   - requires_legal_eligibility_attestation: true
   - verification_timing: before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: true
2. AGE_18_ID_VERIFICATION
   - minimum_age: 18
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_government_id: true
   - requires_third_party_age_verification: true
   - requires_legal_eligibility_attestation: true
   - verification_timing: before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: true
3. AGE_21_ID_VERIFICATION
   - minimum_age: 21
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_government_id: true
   - requires_third_party_age_verification: true
   - requires_legal_eligibility_attestation: true
   - verification_timing: before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: true
4. FOID_OR_PERMIT_REQUIRED
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_government_id: true
   - requires_legal_eligibility_attestation: true
   - requires_permit_upload: true
   - requires_foid_card: true
   - requires_manual_review: true
   - waiting_period_hours: configurable
   - verification_timing: after_order_before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: false
5. LICENSE_TO_CARRY_OR_FIREARM_ID_REQUIRED
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_government_id: true
   - requires_firearm_identification_card: true
   - requires_license_to_carry: true
   - requires_manual_review: true
   - verification_timing: after_order_before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: false
6. LOCAL_LICENSE_BACKGROUND_BRIEFING_REQUIRED
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_government_id: true
   - requires_background_check: true
   - requires_safety_briefing_confirmation: true
   - requires_seller_license: true
   - requires_local_vendor: true
   - requires_manual_review: true
   - verification_timing: after_order_before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: false
7. SELLER_LICENSE_OR_VOLUME_THRESHOLD_REQUIRED
   - requires_seller_license: true
   - requires_manual_review: true
   - verification_timing: checkout
   - payment_timing: no_payment_allowed
   - shipment_allowed_before_review: false
8. PARENTAL_CONSENT_REQUIRED
   - requires_age_gate: true
   - requires_date_of_birth: true
   - requires_parental_consent: true
   - requires_manual_review: true
   - verification_timing: after_order_before_payment
   - payment_timing: payment_after_verification_only
   - shipment_allowed_before_review: false
9. BLOCKED
   - default_decision: blocked
   - verification_timing: checkout
   - payment_timing: no_payment_allowed
   - shipment_allowed_before_review: false
10. MANUAL_REVIEW_DEFAULT
   - default_decision: manual_review
   - requires_manual_review: true
   - verification_timing: checkout
   - payment_timing: no_payment_allowed
   - shipment_allowed_before_review: false

## State grouping

Use reusable verification templates, but every state/local/product rule must explicitly map to one template.

Do not assume a state belongs to a group unless the rule table maps it there.

Do not hard-code groups in code.

## Default verification rules

- Unknown state defaults to MANUAL_REVIEW_DEFAULT.
- Unknown local rule defaults to the state rule.
- Unknown product feature defaults to MANUAL_REVIEW_DEFAULT.
- knuckle_stun_device defaults to MANUAL_REVIEW_DEFAULT in all states until reviewed.
- If product has knuckle_grip or metallic_knuckle_shape, run product feature restriction checks in addition to stun-gun checks.
- If any rule is blocked, checkout is blocked.
- If any rule is manual_review, create pending_admin_review order and do not collect payment.
- If any rule requires document upload, create pending_document_upload order and do not collect payment unless admin changes the payment_timing rule.

## Age and identity verification provider adapter

Add a verification provider adapter for future age and identity checks.

## Create

- lib/verification/verification-provider.ts
- lib/verification/mock-verification-provider.ts
- lib/verification/third-party-verification-provider.ts

## Verification provider interface must support

- createVerificationSession
- getVerificationResult
- handleVerificationWebhook
- verifyVerificationWebhookSignature
- expireVerificationSession

## Verification provider result fields

- provider_name
- provider_reference
- status: pending, passed, failed, expired, manual_review
- verified_age
- minimum_age_checked
- identity_match_status
- document_check_status
- liveness_check_status
- risk_signals
- result_snapshot
- created_at
- updated_at

## Behavior

- Use mock verification provider during development.
- Do not invent production provider API endpoints.
- Store only verification provider reference, status, timestamp, and result snapshot.
- Do not store raw identity documents unless document upload is explicitly required by a rule.
- If a third-party verification webhook is received, verify webhook signature before updating BuyerVerificationRecord.
- Verification webhook handling must be idempotent.

## Website entry behavior

- Do not require hard ID verification to enter the general website.
- Add a soft age gate on restricted product pages if the product category requires it.
- The soft age gate is only a browsing warning, not proof of age.
- Hard verification happens during checkout after shipping address is entered and before payment, unless a rule requires earlier verification.
- Admin can change age-gate behavior by product category.

## Address validation

Add address validation before compliance and verification decisions.

## Create models

- AddressValidationResult
- AddressRiskSignal

## AddressValidationResult fields

- id
- user_id
- order_id
- address_id
- country
- state
- city
- county
- zip_code
- normalized_address
- address_type: residential, commercial, PO_box, freight_forwarder, military, unknown
- validation_status: not_checked, valid, invalid, partial_match, manual_review
- provider_name
- provider_reference
- risk_level: low, medium, high
- risk_reasons
- created_at
- updated_at

## Address validation behavior

- Shipping country must default to United States only.
- Admin can enable other countries later, but disabled by default.
- Validate state, city, county, ZIP code, and address line.
- Normalize the address before rule lookup.
- Use normalized state/county/city/ZIP for compliance rules.
- If ZIP does not match state, block or manual_review.
- If city/state/ZIP cannot be validated, manual_review.
- If address is PO_box, apply PO box rule from CarrierRestrictionRule.
- If no PO box rule exists for restricted product, manual_review.
- If address appears to be a freight forwarder, manual_review.
- If address is military/APO/FPO/DPO, manual_review unless explicitly allowed.
- If billing state and shipping state are different for a restricted product, manual_review.
- Save address validation result into OrderVerificationSnapshot.

## Create address validation provider interface

- lib/address/address-provider.ts
- lib/address/mock-address-provider.ts
- lib/address/production-address-provider.ts

## Address provider interface must support

- validateAddress
- normalizeAddress
- detectAddressType
- detectFreightForwarder
- getCountyFromZip

Do not invent production address provider API endpoints.

Use mock address provider during development.

## Tax system

Add sales tax support without hard-coding tax rates.

## Create models

- TaxProviderSetting
- TaxCalculation
- TaxLineItem

## TaxProviderSetting fields

- id
- provider_name: mock, taxjar, avalara, disabled
- status: development, configured, production_ready, disabled
- credentials_reference
- last_tested_at
- created_at
- updated_at

## TaxCalculation fields

- id
- order_id
- provider_name
- subtotal
- discount_total
- shipping_total
- taxable_amount
- tax_total
- grand_total
- destination_state
- destination_county
- destination_city
- destination_zip
- product_tax_category
- provider_reference
- calculation_snapshot
- created_at

## TaxLineItem fields

- id
- tax_calculation_id
- order_item_id
- taxable_amount
- tax_rate
- tax_amount
- jurisdiction_name
- jurisdiction_type
- created_at

## Create tax provider interface

- lib/tax/tax-provider.ts
- lib/tax/mock-tax-provider.ts
- lib/tax/taxjar-provider.ts
- lib/tax/avalara-provider.ts

## Tax provider interface must support

- calculateTax
- validateTaxAddress
- createTransactionRecord
- refundTax

## Tax behavior

- Use mock tax provider during development.
- Do not hard-code tax rates.
- Do not invent TaxJar or Avalara API calls.
- Tax calculation must happen after shipping address validation and before payment.
- Order must store subtotal, discount_total, shipping_total, tax_total, and grand_total.
- Payment amount must equal the final grand_total.
- Tax snapshot must be saved with the order.
- Live checkout cannot be enabled until tax provider is configured or Owner explicitly sets tax provider to disabled with documented reason.

## Policy and terms versioning

## Create models

- LegalPolicy
- LegalPolicyVersion
- CustomerPolicyAcceptance

## LegalPolicy fields

- id
- code
- name
- status: active, archived
- created_at
- updated_at

## LegalPolicyVersion fields

- id
- legal_policy_id
- version_number
- title
- body
- effective_at
- status: draft, active, archived
- created_by_admin_id
- created_at
- updated_at

## CustomerPolicyAcceptance fields

- id
- user_id
- order_id
- legal_policy_id
- legal_policy_version_id
- accepted_at
- ip_address
- user_agent
- acceptance_context: account_signup, checkout, document_upload, manual_review
- created_at

## Policies requiring versioning

- Terms of Use
- Privacy Policy
- Shipping Policy
- Returns Policy
- Restricted Products Policy
- Legal Eligibility Certification
- Age and Identity Verification Consent
- Document Upload and Retention Policy

## Checkout behavior

- Customer must accept active required policy versions before payment.
- Order must store exact policy versions accepted by the customer.
- If a required policy changes, customer must accept the new version before checkout.
- Old policy versions must never be deleted.
- Admin can draft and activate new policy versions.
- Policy activation requires Owner or Compliance Admin permission.
- Legal policy acceptance must be visible in admin order detail.

## Checkout UX

## Use step-based checkout

1. Cart review
2. Shipping address
3. Address validation
4. Compliance and verification calculation
5. Required buyer verification steps
6. Coupon and membership discount
7. Tax calculation
8. Hosted payment redirect if payment is allowed
9. Confirmation

## Checkout verification flow

1. Customer views restricted product page.
2. Product page shows soft age gate if required.
3. Customer adds item to cart.
4. Customer enters shipping address.
5. System validates and normalizes address.
6. System selects state, local, product feature, carrier, payment provider, risk, and verification rules.
7. System calculates required verification template.
8. System shows required verification steps.
9. Customer completes required steps.
10. Customer accepts current required legal policy versions.
11. If state requires manual review, create pending_admin_review order.
12. If document upload is required, create pending_document_upload order.
13. If state is blocked, block checkout.
14. If verification passes and rule allows payment, calculate tax, reserve stock, and create hosted checkout session.
15. Do not create payment session until verification is complete and payment is allowed.
16. Save OrderVerificationSnapshot.
17. Save VerificationAuditLog.

## Legal eligibility confirmation must include

- Customer confirms they are old enough under the applicable rule.
- Customer confirms they are legally allowed to purchase, possess, and receive the product.
- Customer confirms the shipping address is their lawful receiving address.
- Customer confirms they will not resell, transfer, or misuse the product illegally.
- Customer confirms they understand restrictions may vary by state and local law.
- Customer confirms all submitted information is accurate.

## Blocked/manual-review UX

- Blocked checkout must explain the reason clearly.
- Manual review checkout must explain that no payment is collected yet.
- Document upload checkout must explain which documents are required.
- Pending review order must show next steps.
- Failed verification must explain the reason and available next action.
- Do not use fake urgency.
- Do not use manipulative fear-based copy.
- Do not hide restrictions.

## Risk and manual-review rules

## Create models

- RiskRule
- RiskAssessment
- RiskSignal

## RiskRule fields

- id
- code
- name
- description
- trigger_type
- threshold_value
- action: allow, manual_review, block
- applies_to_product_category
- enabled
- created_at
- updated_at

## RiskAssessment fields

- id
- order_id
- user_id
- risk_score
- risk_level: low, medium, high
- final_action: allow, manual_review, block
- risk_snapshot
- created_at

## RiskSignal fields

- id
- risk_assessment_id
- signal_code
- signal_label
- signal_value
- action
- created_at

## Manual-review triggers must include

- billing state differs from shipping state
- billing name differs from customer name
- document name differs from customer name
- high quantity order
- high order value
- repeated failed payments
- customer attempts blocked state then changes to allowed state
- freight forwarder address
- PO box for restricted product
- suspicious email domain
- repeated checkout attempts with different addresses
- IP country does not match shipping country
- payment provider fraud response
- verification provider risk response

## Risk behavior

- Risk assessment happens before payment.
- If risk action is block, do not create payment session.
- If risk action is manual_review, create pending_admin_review order and do not collect payment unless Owner or authorized admin approves.
- Risk result must be saved in OrderVerificationSnapshot.
- Risk rules must be editable from admin.
- Risk rule changes require notes and AuditLog.

## Order system

## Create models

- Order
- OrderItem
- PaymentAttempt
- Refund
- ShippingAddress
- OrderRestrictionSnapshot
- OrderVerificationSnapshot

## Order statuses

- draft
- pending_verification
- pending_document_upload
- pending_admin_review
- verification_failed
- verification_passed
- ready_for_payment
- pending_payment
- paid
- payment_failed
- cancelled
- cancelled_due_to_failed_verification
- fulfilled
- refunded
- partially_refunded

## PaymentAttempt statuses

- created
- pending
- succeeded
- failed
- cancelled
- expired
- refunded
- partially_refunded

## Order behavior

- Blocked state creates no paid order and no payment attempt.
- Manual-review state creates pending_admin_review order and no payment attempt.
- Document-required state creates pending_document_upload order and no payment attempt.
- Allowed simple state creates payment only after verification and legal attestation.
- Order must save compliance snapshot and verification snapshot.
- Old order must preserve old rule snapshot after admin changes rule.
- Admin can approve pending_document_upload or pending_admin_review.
- After admin approval, order becomes ready_for_payment.
- Customer can return and pay after approval.
- Failed verification changes order to verification_failed or cancelled_due_to_failed_verification.
- Cancelled or failed orders release inventory reservation.

## Refund behavior

- Refund requires reason.
- Refund creates Refund record.
- Refund creates AuditLog.
- Refund calls payment provider refundPayment when real provider is active.
- Mock refund must work in development.

## Schema consistency rules

- Use pending_admin_review as the Order status.
- Do not use pending_review as an Order status.
- Use manual_review only as a compliance, verification, or risk decision value.
- Use pending_document_upload as the Order status when documents are required.
- Use ready_for_payment only after admin/verification approval.
- Add document_required as computed helper result.
- Add payment_allowed_before_verification as computed helper result from payment_timing.
- Add fulfillment_allowed as computed helper result from compliance, verification, payment, carrier, and risk rules.

## SellerLicenseThresholdRule model

- id
- state
- county
- city
- zip_code
- product_compliance_category
- maximum_units_before_license_required
- rolling_period_days
- action_after_threshold: manual_review, block
- verification_template_id
- notes
- source_name
- source_url
- statute_reference
- verification_status
- effective_date
- last_reviewed_at
- created_at
- updated_at

## Admin compliance and verification UI

## Add pages for

- Verification template manager
- State verification rule manager
- Local verification rule manager
- Product feature restriction manager
- Buyer verification review queue
- Buyer document review queue
- Verification audit log
- Rule source and evidence manager
- Rule coverage dashboard

## Admin verification features

- Admin can map a state to a verification template.
- Admin can map a city/county/ZIP to a local override.
- Admin can map a product feature to an extra restriction rule.
- Admin can change minimum age without code change.
- Admin can require FOID/manual review without code change.
- Admin can require firearm ID/license-to-carry without code change.
- Admin can require seller license without code change.
- Admin can require background check/safety briefing/manual review without code change.
- Admin can set a state to blocked without code change.
- Admin can set a state to manual_review without code change.
- Old verification rules must be versioned, not deleted.
- Rule changes require source, note, and reviewer.
- Attorney-reviewed or provider-approved status must be visible in admin.
- Admin can approve or reject buyer documents.
- Admin document decisions require notes.
- Admin document views must be logged.

## Production launch gates

## Create models

- LaunchGate
- LaunchGateCheck

## LaunchGate fields

- id
- code
- name
- status: disabled, blocked, ready, enabled
- approved_by_owner_id
- approved_at
- notes
- created_at
- updated_at

## LaunchGateCheck fields

- id
- launch_gate_id
- check_key
- check_label
- check_status: passed, failed, warning, not_checked
- check_result
- checked_at

## Launch gates

- checkout_launch_gate
- payment_launch_gate
- fulfillment_launch_gate

## Live checkout cannot be enabled unless

- all 50 states plus D.C. have rule coverage
- restricted product categories have verification rules
- address validation is configured
- tax provider is configured or explicitly disabled by Owner with reason
- carrier rules are configured
- payment provider rules are configured
- legal policies are active
- backup script has passed
- production database safety check has passed

## Live payments cannot be enabled unless

- LIVE_CHECKOUT_ENABLED=true
- payment provider is not mock
- NMI or approved provider credentials exist
- webhook verification is configured
- test transaction has passed in sandbox or test mode
- Owner approves payment launch gate

## Live fulfillment cannot be enabled unless

- LIVE_CHECKOUT_ENABLED=true
- LIVE_PAYMENTS_ENABLED=true
- carrier rules are configured
- compliance and verification rules are configured
- fulfillment hold logic is enabled
- Owner approves fulfillment launch gate

## Admin behavior

- Only Owner can enable launch gates.
- Launch gate changes must create AuditLog entries.
- If launch gate is disabled, customer-facing checkout/payment/fulfillment must show safe disabled state.
- Never allow live payment if PAYMENT_PROVIDER=mock.

## Database safety

Use PostgreSQL.

## Safety rules

- Use separate development, staging, and production databases.
- Never run prisma migrate reset in production.
- Never run prisma db push in production.
- Production migrations must use prisma migrate deploy.
- Add pre-migration backup script using pg_dump.
- Add manual admin database export request.
- Add backup file timestamping.
- Add restore instructions.
- Use soft delete/archive for products, users, coupons, admin users, and rules.
- Orders must never be deleted from admin.
- Restriction rules must be versioned, not deleted.
- Verification rules must be versioned, not deleted.
- Backup actions require Owner permission.

## Create scripts

- scripts/backup-database.ts
- scripts/restore-local-database.ts
- scripts/database-safety-check.ts
- scripts/pre-migration-backup.ts

## Package scripts

- db:migrate:dev
- db:migrate:prod
- db:backup
- db:restore:local
- db:safety-check
- test:e2e
- test:e2e:ui
- dev
- build
- start

## Block dangerous commands in production

- prisma migrate reset
- prisma db push
- prisma migrate dev
- DROP DATABASE
- DROP SCHEMA
- TRUNCATE
- uncontrolled DELETE on users, orders, products, coupons, restriction rules, verification rules, admin users

## Audit log

Create AuditLog model.

## AuditLog must record

- product created
- product edited
- product archived
- stock changed
- coupon created
- coupon disabled
- restriction rule changed
- verification rule changed
- verification template changed
- buyer document uploaded
- buyer document viewed
- buyer document approved
- buyer document rejected
- membership tier changed
- order refunded
- admin invited
- admin deactivated
- admin role changed
- admin login
- failed admin login
- backup created
- migration started
- migration completed
- migration failed
- payment provider changed
- checkout blocked
- checkout manual_review
- checkout allowed
- payment success
- payment failure
- webhook rejected
- webhook accepted
- address validation failed
- tax calculated
- launch gate changed
- risk rule changed
- risk assessment created
- policy version activated
- policy accepted
- notification sent
- notification failed
- shipping delay notice sent
- shipping delay consent accepted
- shipping delay consent rejected

## Shipping and fulfillment

## Add

- ShippingCarrier
- ShippingMethod
- FulfillmentHold
- ShippingPromise
- ShippingDelayNotice
- CustomerDelayConsent

## ShippingPromise fields

- id
- order_id
- promised_ship_by_date
- promised_delivery_window
- promise_source: product_page, checkout, admin, default_policy
- created_at

## ShippingDelayNotice fields

- id
- order_id
- original_promised_ship_by_date
- revised_ship_by_date
- delay_reason
- notice_status: draft, sent, accepted, rejected, expired
- sent_at
- created_at

## CustomerDelayConsent fields

- id
- order_id
- shipping_delay_notice_id
- response: accepted_delay, rejected_delay, no_response
- responded_at
- created_at

## Fulfillment behavior

- Do not allow fulfillment if compliance snapshot says blocked.
- Do not allow fulfillment if verification is pending.
- Do not allow fulfillment if document review is pending.
- Do not allow fulfillment if payment is unpaid.
- Do not allow fulfillment if carrier rule is blocked.
- Do not allow fulfillment if risk decision is manual_review or blocked.
- Do not allow fulfillment if shipping delay consent is required and missing.
- Manual fulfillment release requires admin permission and audit log.

## Shipping delay behavior

- Product page and checkout must show estimated shipping time or state that shipping estimate is unavailable.
- System must store the shipping promise used at checkout.
- If no specific shipping time is promised, use the default policy deadline.
- If the order cannot ship by the promised date, create ShippingDelayNotice.
- Delay notice must give customer the option to consent to the delay or cancel for refund.
- If customer rejects the delay, cancel and refund according to policy.
- If customer does not respond when response is required, cancel and refund according to policy.
- If revised shipping date is missed, send renewed delay notice or cancel/refund.
- Shipping delay notices must be logged.
- Refund from delay cancellation must create Refund and AuditLog records.

## Transactional email and notification flow

## Create models

- NotificationTemplate
- NotificationLog
- NotificationProviderSetting

## NotificationTemplate fields

- id
- code
- channel: email, sms, admin_notification
- subject
- body
- status: draft, active, disabled
- created_at
- updated_at

## NotificationLog fields

- id
- user_id
- order_id
- notification_template_id
- channel
- recipient
- subject
- status: queued, sent, failed, skipped
- provider_name
- provider_reference
- error_message
- sent_at
- created_at

## NotificationProviderSetting fields

- id
- provider_name: mock, resend, sendgrid, ses, disabled
- status: development, configured, production_ready, disabled
- credentials_reference
- created_at
- updated_at

## Create notification provider interface

- lib/notifications/notification-provider.ts
- lib/notifications/mock-notification-provider.ts
- lib/notifications/production-notification-provider.ts

## Notification provider interface must support

- sendEmail
- sendAdminAlert
- getDeliveryStatus

## Required customer notifications

- account created
- order pending verification
- document upload requested
- document received
- document approved
- document rejected
- order ready for payment
- payment succeeded
- payment failed
- order cancelled
- order refunded
- shipment delayed
- shipment delay consent requested
- shipment delay accepted
- shipment delay rejected
- order fulfilled

## Required admin notifications

- new pending_admin_review order
- new pending_document_upload order
- document uploaded
- high-risk order detected
- payment webhook failed verification
- backup failed
- production launch gate changed

## Notification rules

- Use mock notification provider during development.
- Do not invent production provider API endpoints.
- Do not send identity document files through email.
- All notification attempts must be logged.
- Failed notification attempts must be visible in admin.

## UI/UX requirements

Use a clean, trustworthy, compliance-first ecommerce design.

## Design direction

- Premium but simple.
- Clear product information.
- Clear shipping restriction messages.
- No aggressive weapon fantasy style.
- No dark patterns.
- No fake urgency.
- No misleading safety claims.
- No excessive red warning design unless there is a real blocked checkout reason.
- Site should look like a serious regulated ecommerce business, not a sketchy weapon store.

## UI stack

- Tailwind CSS for styling.
- shadcn/ui for reusable components.
- Radix UI primitives for accessible dialogs, dropdowns, tabs, accordions, select menus, and modals.
- Use a reusable design system folder.

## Design tokens

## Define

- typography scale
- spacing scale
- border radius
- button variants
- alert variants
- form field states
- status badges
- admin table styles
- checkout stepper styles

## Customer UX

- Product cards show price, stock status, and restricted-product badge.
- Product detail page shows description, specifications, shipping restriction reminder, and legal eligibility reminder.
- Cart shows item total, coupon field, estimated shipping note, and checkout button.
- Checkout is step-by-step, not one giant form.
- Checkout must show which verification steps are required before payment.
- Blocked checkout explains reason clearly.
- Manual review checkout explains no payment is collected yet.
- Document upload checkout explains next steps.
- Payment redirects to hosted checkout only after verification passes.
- Order confirmation shows order number, payment status, shipping status, compliance status, and verification status.

## Admin UX

- Admin dashboard is table-first and efficient.
- Use filters, search, and status badges.
- Dangerous actions require confirmation dialog.
- Rule changes require notes.
- Stock changes require reason.
- Refunds require reason.
- Document approvals/rejections require notes.
- Admin role changes require Owner permission.
- Backup/export actions require Owner permission.
- Show audit log entries clearly.

## Accessibility

- Use semantic HTML.
- Use visible labels on forms.
- Use keyboard-accessible controls.
- Use visible focus states.
- Use text-based error messages.
- Do not rely on color alone.
- Forms must show what field failed and how to fix it.
- Checkout must be usable on mobile.
- Admin tables must remain readable on laptop screens.

## Seed data

## Create seed data

- Owner admin user
- Membership tiers: Guest, Member, VIP, Wholesale, Admin
- Several example products
- One restricted knuckle_stun_device product
- WELCOME10 coupon
- All 50 U.S. states plus District of Columbia
- All unknown states = MANUAL_REVIEW_DEFAULT
- knuckle_stun_device default = MANUAL_REVIEW_DEFAULT in all states
- Mock payment provider = approved for development
- NMI payment provider = manual_review until approved
- Authorize.Net payment provider = manual_review until approved
- Clover payment provider = conditional/manual_review until approved
- Mock tax provider = configured for development
- Mock address provider = configured for development
- Mock verification provider = configured for development
- Mock notification provider = configured for development
- Example 18+ attestation state rule
- Example FOID/permit-required state rule
- Example local-license/background/briefing-required state rule
- Example seller-license threshold rule
- Example blocked state rule
- Active policy versions for required checkout policies
- Launch gates disabled by default

Seed data must clearly mark legal/compliance rules as unverified unless explicitly set otherwise.

Do not mark a state as attorney_reviewed or provider_approved unless that status is explicitly imported from a reviewed source file.

## End-to-end tests with Playwright

## Customer/store tests

1. Product listing page loads.
2. Product detail page loads.
3. Restricted product page shows soft age gate.
4. Home page does not require hard ID verification.
5. User can add product to cart.
6. User can create account.
7. User can log in.
8. User can apply valid coupon.
9. Invalid coupon is rejected.
10. Member-only coupon is rejected for non-member.

## Checkout/compliance/verification tests

11. Checkout asks for shipping address before state-specific verification.
12. Checkout blocked without age/legal confirmation.
13. Checkout blocked for blocked state.
14. Unknown state creates manual_review and does not collect payment.
15. 18+ attestation template requires age/legal attestation.
16. ID verification template requires date of birth/government ID step placeholder.
17. FOID/permit-required rule creates pending_document_upload order and does not collect payment.
18. Local-license/background/briefing rule creates pending_admin_review order and does not collect payment.
19. Seller-license threshold rule creates manual review when threshold is exceeded.
20. knuckle_stun_device runs both electric-device and knuckle-feature checks.
21. If one rule is allowed and another is blocked, final result is blocked.
22. If one rule is allowed and another is manual_review, final result is manual_review.
23. Payment session is not created until verification passes.
24. Manual review order does not collect payment.
25. Blocked order does not collect payment.
26. Order saves verification snapshot.
27. Old order keeps old verification snapshot after rule changes.
28. Customer can upload required document for document-required order.
29. Admin can approve document and order becomes ready_for_payment.
30. Admin can reject document and order becomes verification_failed.

## Payment tests

31. Mock provider success works.
32. Mock provider failure works.
33. Payment provider can be switched by environment variable.
34. Payment is not created when compliance fails.
35. Payment is not created for manual_review order.
36. Payment is not created for pending_document_upload order.
37. Webhook handler rejects invalid signature.
38. Webhook handler is idempotent.
39. Successful payment reduces stock.
40. Failed payment releases reserved stock.

## Admin tests

41. Owner can invite admin.
42. Owner can deactivate admin.
43. Non-owner cannot manage Owner account.
44. Admin can add product.
45. Admin can edit product.
46. Admin can archive product.
47. Admin can add stock.
48. Admin can reduce stock with reason.
49. Admin can create coupon.
50. Admin can disable coupon.
51. Admin can update minimum age rule.
52. Admin can change state rule to blocked.
53. Admin can update state verification template without code change.
54. Admin can update minimum age from 18 to 21 without code change.
55. Admin can require FOID without code change.
56. Admin can block knuckle-feature products without blocking all stun guns.
57. Admin can view compliance audit log.
58. Admin can view verification audit log.
59. Backup script creates timestamped backup file.
60. Dangerous production database command is blocked.

## State coverage tests

61. All 50 states plus D.C. are seeded.
62. Missing state rule creates manual_review.
63. Missing product feature rule creates manual_review.
64. Rule coverage dashboard shows missing/unverified rules.

## Address validation tests

65. ZIP/state mismatch creates manual_review or blocked result.
66. PO box address creates manual_review or blocked result based on rule.
67. Freight forwarder address creates manual_review.
68. Billing/shipping state mismatch creates manual_review.
69. Address validation snapshot is saved on order.

## Tax tests

70. Tax is calculated before payment.
71. Payment amount equals grand_total.
72. Tax snapshot is saved on order.
73. Live checkout is blocked if tax launch condition is not satisfied.

## Verification provider tests

74. Mock verification provider can pass.
75. Mock verification provider can fail.
76. Verification webhook rejects invalid signature.
77. Verification webhook is idempotent.

## Policy versioning tests

78. Customer must accept active policies before payment.
79. New policy version forces re-acceptance before checkout.
80. Order stores accepted policy versions.

## Launch gate tests

81. LIVE_CHECKOUT_ENABLED=false blocks live checkout.
82. LIVE_PAYMENTS_ENABLED=false blocks live payment.
83. LIVE_FULFILLMENT_ENABLED=false blocks fulfillment.
84. Non-owner cannot enable launch gates.
85. Owner can enable launch gate only when checks pass.
86. Mock payment cannot be used when live payments are enabled.

## Risk tests

87. High quantity order creates manual_review.
88. Repeated failed payments create manual_review.
89. Customer changing from blocked state to allowed state creates manual_review.
90. Risk decision is saved on order snapshot.

## Notification tests

91. Pending document upload sends document request notification.
92. Document approval sends ready-for-payment notification.
93. Payment success sends payment success notification.
94. Refund sends refund notification.
95. Notification logs are visible in admin.

## Shipping delay tests

96. Shipping promise is stored at checkout.
97. Delayed order creates ShippingDelayNotice.
98. Customer can accept delay.
99. Customer can reject delay and trigger cancellation/refund.
100. Fulfillment is blocked when required delay consent is missing.

## README

## Add documentation for

- install dependencies
- environment variables
- database migration
- database seed
- running local development
- running Playwright tests
- using mock payment provider
- switching payment provider
- adding real NMI credentials
- adding real Authorize.Net credentials
- backup and restore
- production migration checklist
- compliance rule workflow
- buyer verification workflow
- admin role workflow
- payment-provider approval workflow
- document retention and review workflow
- address validation workflow
- tax provider workflow
- policy versioning workflow
- launch gate workflow
- risk review workflow
- notification workflow
- shipping delay/refund workflow
- live launch checklist

## Build order

1. Database schema
2. Seed data
3. Storefront pages
4. Product and cart
5. Admin authentication and Owner role
6. Product admin
7. Inventory system
8. Membership system
9. Coupon system
10. Compliance rule engine
11. Buyer eligibility verification engine
12. Address validation
13. Tax provider adapter
14. Policy versioning
15. Risk rule engine
16. Document/manual review queue
17. Checkout flow
18. Mock payment provider
19. Order system
20. Notification system
21. Shipping delay workflow
22. Launch gates
23. Backup and audit log
24. Playwright tests
25. NMI provider stub
26. Authorize.Net provider stub
27. Clover provider stub

## Development instruction

Build in small phases.

## After each phase

- run typecheck
- run lint
- run tests
- show what files changed
- explain what is complete
- explain what is still stubbed

Do not attempt to build the entire final system in one uncontrolled change.

## First implementation phase

## Start with

- Prisma schema
- database seed
- basic storefront
- admin Owner role
- product model
- inventory model
- compliance rule model
- verification template model
- buyer verification model
- address validation model
- tax calculation model
- policy version model
- launch gate model
- risk rule model
- mock payment provider model
- basic Playwright smoke test

## Important final rules

- Build the app now.
- Do not launch real payments yet.
- Use mock payment first.
- Use NMI Hosted Checkout only after PNC/NMI confirms the exact gateway and provides credentials.
- Keep Authorize.Net as backup.
- Keep Clover conditional only.
- Do not invent legal claims.
- Do not invent payment API endpoints.
- Keep all compliance rules editable from admin.
- Keep all verification rules editable from admin.
- Keep all payment providers replaceable.
- Keep all destructive data actions blocked in production.
- Do not collect payment until the rule engine says payment is allowed.
- Do not fulfill an order until the rule engine says fulfillment is allowed.
- Do not allow restricted-product checkout to pass because a rule is missing.
- Do not enable live checkout, live payment, or live fulfillment without Owner-approved launch gates.
---

# Final Master Spec Hardening Addendum

## 1. Customer checkout UX correction

The customer-facing checkout should use a simple five-step flow:

1. Cart
2. Shipping
3. Eligibility
4. Payment
5. Confirmation

Do not expose every internal compliance step as a separate customer-facing checkout step.

The Eligibility step includes these internal checks:

- address validation
- state rule check
- local rule check
- product feature rule check
- buyer age/legal attestation
- document requirement
- risk rule check
- payment provider eligibility
- carrier eligibility
- manual review decision

The admin system can show the full internal decision tree, but the customer checkout must remain simple and clear.

## 2. Automatic-first verification rule

The system must use automatic verification first.

Normal order flow:

- automatic address validation
- automatic state/local/product-feature rule lookup
- automatic age/legal attestation check
- automatic risk check
- automatic payment eligibility decision
- payment allowed if all checks pass

Manual review is only for exceptions:

- missing rule
- unclear rule
- document-required state
- FOID / permit / license required
- third-party verification failure
- document mismatch
- billing/shipping mismatch
- freight forwarder
- PO box for restricted product
- high-risk order
- provider fraud/risk response
- admin override

Rename admin UX:

- Buyer verification review queue -> Exception review queue
- Buyer document review queue -> Document review queue

Admin copy must say:

> Most orders are checked automatically. Only exceptions, document-required orders, failed verification, unclear rules, or risk signals appear here.

## 3. Authentication and account security

Add models and implementation requirements for:

- email/password authentication
- password hashing
- email verification
- password reset
- session management
- secure cookies
- CSRF protection for state-changing actions
- login rate limiting
- failed login tracking
- admin login tracking
- admin two-factor authentication
- Owner two-factor authentication required
- account lockout for repeated failed admin logins

Add models:

- UserSession
- PasswordResetToken
- EmailVerificationToken
- AdminTwoFactorSetting
- LoginAttempt

Admin authentication must be stricter than customer authentication.

## 4. Role-based access control matrix

Create a permission system, not just role names.

Add models:

- Permission
- RolePermission
- AdminPermissionOverride

Every admin action must check permission.

Examples:

- products:create
- products:update
- products:archive
- inventory:adjust
- orders:view
- orders:refund
- documents:view
- documents:approve
- documents:reject
- compliance_rules:update
- verification_templates:update
- admins:invite
- admins:deactivate
- launch_gates:update
- backups:create
- payment_settings:update

Owner has all permissions.

No admin can remove the last Owner.

## 5. Webhook and idempotency system

Add model:

- WebhookEvent

WebhookEvent fields:

- id
- provider_name
- event_type
- provider_event_id
- raw_payload_reference
- signature_valid
- processing_status: received, processed, ignored_duplicate, failed
- idempotency_key
- related_order_id
- related_payment_attempt_id
- error_message
- received_at
- processed_at

Use WebhookEvent for:

- payment webhooks
- verification provider webhooks
- tax provider webhooks if needed
- notification provider webhooks if needed

Duplicate webhooks must not double-charge, double-refund, double-reduce stock, or double-send notifications.

## 6. Order state transition tracking

Add model:

- OrderStateTransition

Fields:

- id
- order_id
- from_status
- to_status
- reason
- actor_type: customer, admin, system, provider
- actor_id
- metadata
- created_at

Every order status change must create an OrderStateTransition.

This is separate from AuditLog.

AuditLog records admin/system events. OrderStateTransition records exact order lifecycle history.

## 7. File and document storage security

Add models:

- StoredFile
- FileAccessLog
- DocumentRetentionPolicy

StoredFile fields:

- id
- file_type
- storage_provider
- storage_key
- original_filename
- mime_type
- file_size
- checksum
- encryption_status
- uploaded_by_user_id
- uploaded_by_admin_id
- created_at
- expires_at
- deleted_at

File rules:

- Never store files in public web folders.
- Never expose direct file URLs.
- Use signed temporary URLs.
- Log every document view.
- Log every document download.
- Restrict document access by permission.
- Add retention/deletion workflow.
- Do not email identity documents.
- Do not store raw identity documents unless required by verification rule.

## 8. Provider settings in database

Add settings models for each provider category:

- PaymentProviderSetting
- TaxProviderSetting
- AddressProviderSetting
- VerificationProviderSetting
- NotificationProviderSetting
- ShippingProviderSetting

Provider settings must support:

- provider_name
- status: disabled, development, sandbox, production_ready, active
- credentials_reference
- webhook_secret_reference
- last_tested_at
- approved_by_owner_id
- notes
- created_at
- updated_at

Never store raw secrets directly in normal database fields.

Use environment variables or secret manager references.

## 9. Shipping labels, tracking, and fulfillment

Add models:

- Shipment
- ShipmentPackage
- TrackingEvent
- ShippingLabel
- FulfillmentBatch

Shipment fields:

- id
- order_id
- carrier_name
- shipping_method
- tracking_number
- label_status: not_created, created, voided, failed
- shipment_status: pending, label_created, shipped, in_transit, delivered, exception, returned
- shipped_at
- delivered_at
- created_at
- updated_at

Fulfillment rules:

- Do not create label until payment is paid.
- Do not create label until compliance allows fulfillment.
- Do not create label until verification is passed.
- Do not create label until document review is approved if required.
- Do not create label if carrier rule is blocked.
- Do not create label if launch fulfillment gate is disabled.

## 10. Returns and RMA workflow

Add models:

- ReturnRequest
- ReturnItem
- ReturnDecision

Return statuses:

- requested
- under_review
- approved
- rejected
- received
- refunded
- closed

Return decisions require admin note.

Restricted products may have special return restrictions.

## 11. Phase-by-phase build policy

The master spec must not be implemented in one Codex task.

Each phase must be its own pull request.

Recommended phases:

1. UX/UI prototype refinement
2. Prisma schema and seed foundation
3. Product/catalog/inventory backend
4. User/account/admin authentication
5. Compliance and verification rule engine
6. Checkout state machine with mock payment
7. Coupon/membership/tax/address providers
8. Order/admin review/document queue
9. Notification system
10. Backup/safety/launch gates
11. Playwright E2E tests
12. NMI sandbox integration
13. Production hardening

Each phase must include:

- what changed
- files changed
- tests run
- what remains mocked
- known risks
- next phase recommendation

## 12. Testing structure

Separate tests into categories:

- unit tests
- service tests
- database tests
- integration tests
- Playwright E2E tests
- provider sandbox tests
- production smoke checklist

Mock payment tests run by default.

NMI sandbox tests are optional and tagged:

- @gateway-sandbox
- @nmi
- @external

Production payment tests must be manual and Owner-gated.

Do not use production cards in automated tests.

## 13. CI/CD and deployment requirements

Add GitHub Actions or equivalent CI.

CI should run:

- install
- typecheck
- lint
- unit tests
- build
- Playwright smoke tests where possible

Production deployment must require:

- passing CI
- database backup before migration
- migration using prisma migrate deploy
- launch gates checked
- Owner approval for live checkout/payment/fulfillment

## 14. Observability and error monitoring

Add future support for:

- structured server logs
- error monitoring
- payment webhook failure alerts
- backup failure alerts
- launch gate change alerts
- failed admin login alerts
- high-risk order alerts
- failed notification alerts

Add model:

- SystemEvent

SystemEvent fields:

- id
- event_type
- severity: info, warning, error, critical
- message
- metadata
- created_at

## 15. Data import workflow for legal rules

Do not manually edit final 50-state compliance truth only in code.

Add import workflow:

- LegalRuleImport
- LegalRuleImportRow
- LegalRuleReviewBatch

The import should support CSV or admin upload.

Each imported rule must include:

- state
- local jurisdiction if applicable
- product category
- product feature
- rule status
- verification template
- source URL
- statute reference
- reviewer
- verification_status
- effective date
- last reviewed date
- notes

No imported rule can become provider_approved or attorney_reviewed without admin approval.

## 16. Search, filtering, and admin productivity

Admin tables should support:

- search
- filters
- sorting
- pagination
- export where safe
- status badges
- bulk actions only where safe
- required notes for dangerous actions

No bulk action may bypass audit logging.

## 17. Customer communication copy rules

All customer-facing copy must be:

- clear
- calm
- compliance-first
- non-aggressive
- non-fear-based
- non-misleading

Do not use:

- fake urgency
- tactical fantasy language
- guaranteed self-defense claims
- exaggerated voltage/pain claims
- legal everywhere claims

## 18. SEO and metadata

Add basic metadata support:

- page title
- meta description
- OpenGraph fields
- canonical URL
- robots behavior
- sitemap later

Restricted product pages should avoid misleading claims.

## 19. Final live launch checklist

Before live launch, require:

- PNC merchant approval stored
- NMI or approved gateway credentials configured
- NMI sandbox payment test passed
- webhook signature verified
- tax provider configured or Owner-disabled with reason
- address validation provider configured
- all state/product rules exist
- high-risk states reviewed
- restricted product policies active
- terms/privacy/shipping/returns active
- backup and restore tested
- launch gates approved
- fulfillment rules configured
- notification provider tested
- admin 2FA enabled
- no mock provider active in production
