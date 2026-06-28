-- Ensure the storefront settings table exists before adding eligibility copy.
-- This migration must replay cleanly from an empty shadow database.
CREATE TABLE IF NOT EXISTS "StorefrontSettings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "heroEyebrow" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroSubtitle" TEXT NOT NULL,
  "primaryCtaLabel" TEXT NOT NULL,
  "primaryCtaLink" TEXT NOT NULL,
  "secondaryCtaLabel" TEXT NOT NULL,
  "secondaryCtaLink" TEXT NOT NULL,
  "heroImageUrl" TEXT NOT NULL DEFAULT '',
  "heroPlaceholderKey" TEXT NOT NULL DEFAULT 'stun-fry-gradient-devices',
  "announcementBarText" TEXT NOT NULL,
  "featuredSectionEyebrow" TEXT NOT NULL,
  "featuredSectionTitle" TEXT NOT NULL,
  "trustComplianceTitle" TEXT NOT NULL,
  "trustComplianceBody" TEXT NOT NULL,
  "trustBadgeLabels" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StorefrontSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontSettings_key_key" ON "StorefrontSettings"("key");

ALTER TABLE "StorefrontSettings"
  ADD COLUMN IF NOT EXISTS "eligibilityPopupTitle" TEXT NOT NULL DEFAULT 'Check restricted-product availability',
  ADD COLUMN IF NOT EXISTS "eligibilityPopupBody" TEXT NOT NULL DEFAULT 'Tell us your age confirmation and shipping destination to preview whether restricted products may be available. This is not final legal approval.',
  ADD COLUMN IF NOT EXISTS "eligibilityAgeConfirmationText" TEXT NOT NULL DEFAULT 'I confirm I am at least 18 years old.',
  ADD COLUMN IF NOT EXISTS "eligibilityStateLabel" TEXT NOT NULL DEFAULT 'Shipping state',
  ADD COLUMN IF NOT EXISTS "eligibilityZipLabel" TEXT NOT NULL DEFAULT 'ZIP code',
  ADD COLUMN IF NOT EXISTS "eligibilityAcknowledgementText" TEXT NOT NULL DEFAULT 'I understand restricted products may be unavailable or require additional verification before payment.';
