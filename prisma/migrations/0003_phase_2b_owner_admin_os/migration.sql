-- Phase 2B Owner Admin Operating System: owner-editable homepage settings.
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
