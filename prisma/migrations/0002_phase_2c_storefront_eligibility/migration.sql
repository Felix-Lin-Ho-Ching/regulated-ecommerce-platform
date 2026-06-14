ALTER TABLE "StorefrontSettings"
  ADD COLUMN IF NOT EXISTS "eligibilityPopupTitle" TEXT NOT NULL DEFAULT 'Check restricted-product availability',
  ADD COLUMN IF NOT EXISTS "eligibilityPopupBody" TEXT NOT NULL DEFAULT 'Tell us your age confirmation and shipping destination to preview whether restricted products may be available. This is not final legal approval.',
  ADD COLUMN IF NOT EXISTS "eligibilityAgeConfirmationText" TEXT NOT NULL DEFAULT 'I confirm I am at least 18 years old.',
  ADD COLUMN IF NOT EXISTS "eligibilityStateLabel" TEXT NOT NULL DEFAULT 'Shipping state',
  ADD COLUMN IF NOT EXISTS "eligibilityZipLabel" TEXT NOT NULL DEFAULT 'ZIP code',
  ADD COLUMN IF NOT EXISTS "eligibilityAcknowledgementText" TEXT NOT NULL DEFAULT 'I understand restricted products may be unavailable or require additional verification before payment.';
