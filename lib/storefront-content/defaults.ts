export type StorefrontContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  heroImageUrl: string;
  heroPlaceholderKey: string;
  announcementBarText: string;
  featuredSectionEyebrow: string;
  featuredSectionTitle: string;
  trustComplianceTitle: string;
  trustComplianceBody: string;
  trustBadgeLabels: string[];
  eligibilityPopupTitle: string;
  eligibilityPopupBody: string;
  eligibilityAgeConfirmationText: string;
  eligibilityStateLabel: string;
  eligibilityZipLabel: string;
  eligibilityAcknowledgementText: string;
};

export const STOREFRONT_SETTINGS_KEY = "default";

export const defaultStorefrontContent: StorefrontContent = {
  heroEyebrow: "Stun Fry safety essentials",
  heroTitle: "Shop Stun Fry personal safety gear built for everyday confidence.",
  heroSubtitle:
    "Browse self-defense devices, alarms, visibility gear, and training essentials with clear restricted-product guidance before checkout.",
  primaryCtaLabel: "Shop products",
  primaryCtaLink: "/products",
  secondaryCtaLabel: "Restricted-product policy",
  secondaryCtaLink: "/restricted-products-policy",
  heroImageUrl: "",
  heroPlaceholderKey: "stun-fry-gradient-devices",
  announcementBarText: "",
  featuredSectionEyebrow: "Featured products",
  featuredSectionTitle: "Shop Stun Fry picks",
  trustComplianceTitle: "Shop confidently with clear availability guidance.",
  trustComplianceBody:
    "Restricted-product availability is previewed before browsing and reviewed again with the shipping address before payment.",
  trustBadgeLabels: ["Fast shipping", "Clear availability", "Secure packaging"],
  eligibilityPopupTitle: "Check restricted-product availability",
  eligibilityPopupBody:
    "Tell us your age confirmation and shipping destination to preview whether restricted products may be available. This is not final legal approval.",
  eligibilityAgeConfirmationText: "I confirm I am at least 18 years old.",
  eligibilityStateLabel: "Shipping state",
  eligibilityZipLabel: "ZIP code",
  eligibilityAcknowledgementText:
    "I understand restricted products may be unavailable or require additional verification before payment.",
};
