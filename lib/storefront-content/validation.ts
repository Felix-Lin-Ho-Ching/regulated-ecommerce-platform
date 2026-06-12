import { defaultStorefrontContent, type StorefrontContent } from "@/lib/storefront-content/defaults";

function readText(formData: FormData, key: keyof StorefrontContent): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safePathOrUrl(value: string, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith("/") || value.startsWith("https://")) return value;
  return fallback;
}

export function parseTrustBadges(raw: string): string[] {
  const badges = raw
    .split("\n")
    .map((badge) => badge.trim())
    .filter(Boolean)
    .slice(0, 8);

  return badges.length > 0 ? badges : defaultStorefrontContent.trustBadgeLabels;
}

export function parseStorefrontContentForm(formData: FormData): StorefrontContent {
  return {
    heroEyebrow: readText(formData, "heroEyebrow") || defaultStorefrontContent.heroEyebrow,
    heroTitle: readText(formData, "heroTitle") || defaultStorefrontContent.heroTitle,
    heroSubtitle: readText(formData, "heroSubtitle") || defaultStorefrontContent.heroSubtitle,
    primaryCtaLabel: readText(formData, "primaryCtaLabel") || defaultStorefrontContent.primaryCtaLabel,
    primaryCtaLink: safePathOrUrl(readText(formData, "primaryCtaLink"), defaultStorefrontContent.primaryCtaLink),
    secondaryCtaLabel: readText(formData, "secondaryCtaLabel") || defaultStorefrontContent.secondaryCtaLabel,
    secondaryCtaLink: safePathOrUrl(readText(formData, "secondaryCtaLink"), defaultStorefrontContent.secondaryCtaLink),
    heroImageUrl: safePathOrUrl(readText(formData, "heroImageUrl"), ""),
    heroPlaceholderKey: readText(formData, "heroPlaceholderKey") || defaultStorefrontContent.heroPlaceholderKey,
    announcementBarText: readText(formData, "announcementBarText") || defaultStorefrontContent.announcementBarText,
    featuredSectionEyebrow: readText(formData, "featuredSectionEyebrow") || defaultStorefrontContent.featuredSectionEyebrow,
    featuredSectionTitle: readText(formData, "featuredSectionTitle") || defaultStorefrontContent.featuredSectionTitle,
    trustComplianceTitle: readText(formData, "trustComplianceTitle") || defaultStorefrontContent.trustComplianceTitle,
    trustComplianceBody: readText(formData, "trustComplianceBody") || defaultStorefrontContent.trustComplianceBody,
    trustBadgeLabels: parseTrustBadges(readText(formData, "trustBadgeLabels")),
  };
}
