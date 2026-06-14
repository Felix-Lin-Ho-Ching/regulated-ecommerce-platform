import { defaultStorefrontContent, STOREFRONT_SETTINGS_KEY, type StorefrontContent } from "@/lib/storefront-content/defaults";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

type StorefrontSettingsRow = Partial<StorefrontContent> & {
  trustBadgeLabels?: unknown;
};

function normalize(row: StorefrontSettingsRow | null | undefined): StorefrontContent {
  if (!row) return defaultStorefrontContent;

  return {
    heroEyebrow: row.heroEyebrow || defaultStorefrontContent.heroEyebrow,
    heroTitle: row.heroTitle || defaultStorefrontContent.heroTitle,
    heroSubtitle: row.heroSubtitle || defaultStorefrontContent.heroSubtitle,
    primaryCtaLabel: row.primaryCtaLabel || defaultStorefrontContent.primaryCtaLabel,
    primaryCtaLink: row.primaryCtaLink || defaultStorefrontContent.primaryCtaLink,
    secondaryCtaLabel: row.secondaryCtaLabel || defaultStorefrontContent.secondaryCtaLabel,
    secondaryCtaLink: row.secondaryCtaLink || defaultStorefrontContent.secondaryCtaLink,
    heroImageUrl: row.heroImageUrl || defaultStorefrontContent.heroImageUrl,
    heroPlaceholderKey: row.heroPlaceholderKey || defaultStorefrontContent.heroPlaceholderKey,
    announcementBarText: typeof row.announcementBarText === "string" ? row.announcementBarText : defaultStorefrontContent.announcementBarText,
    featuredSectionEyebrow: row.featuredSectionEyebrow || defaultStorefrontContent.featuredSectionEyebrow,
    featuredSectionTitle: row.featuredSectionTitle || defaultStorefrontContent.featuredSectionTitle,
    trustComplianceTitle: row.trustComplianceTitle || defaultStorefrontContent.trustComplianceTitle,
    trustComplianceBody: row.trustComplianceBody || defaultStorefrontContent.trustComplianceBody,
    trustBadgeLabels: Array.isArray(row.trustBadgeLabels)
      ? row.trustBadgeLabels.filter((item): item is string => typeof item === "string")
      : defaultStorefrontContent.trustBadgeLabels,
    eligibilityPopupTitle: row.eligibilityPopupTitle || defaultStorefrontContent.eligibilityPopupTitle,
    eligibilityPopupBody: row.eligibilityPopupBody || defaultStorefrontContent.eligibilityPopupBody,
    eligibilityAgeConfirmationText: row.eligibilityAgeConfirmationText || defaultStorefrontContent.eligibilityAgeConfirmationText,
    eligibilityStateLabel: row.eligibilityStateLabel || defaultStorefrontContent.eligibilityStateLabel,
    eligibilityZipLabel: row.eligibilityZipLabel || defaultStorefrontContent.eligibilityZipLabel,
    eligibilityAcknowledgementText: row.eligibilityAcknowledgementText || defaultStorefrontContent.eligibilityAcknowledgementText,
  };
}

export async function getStorefrontContent(): Promise<StorefrontContent> {
  if (!isDatabaseConfigured) return defaultStorefrontContent;

  const row = await prisma.storefrontSettings.findUnique({
    where: { key: STOREFRONT_SETTINGS_KEY },
  });

  return normalize(row as StorefrontSettingsRow | null);
}

export async function upsertStorefrontContent(content: StorefrontContent) {
  if (!isDatabaseConfigured) return;

  await prisma.storefrontSettings.upsert({
    where: { key: STOREFRONT_SETTINGS_KEY },
    update: { ...content, trustBadgeLabels: content.trustBadgeLabels },
    create: { key: STOREFRONT_SETTINGS_KEY, ...content, trustBadgeLabels: content.trustBadgeLabels },
  });
}
