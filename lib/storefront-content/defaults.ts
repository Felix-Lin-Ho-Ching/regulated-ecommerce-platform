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
  secondaryCtaLabel: "Check your state",
  secondaryCtaLink: "/restricted-products-policy",
  heroImageUrl: "",
  heroPlaceholderKey: "stun-fry-gradient-devices",
  announcementBarText: "Free shipping on qualifying orders",
  featuredSectionEyebrow: "Featured products",
  featuredSectionTitle: "Shop Stun Fry picks",
  trustComplianceTitle: "Questions before you order?",
  trustComplianceBody:
    "Review shipping eligibility basics, then complete address verification during checkout when you are ready to order.",
  trustBadgeLabels: [
    "Trusted support",
    "Proven self-defense tools",
    "Shipping eligibility checked at checkout",
    "Product replacement guarantee",
  ],
  eligibilityPopupTitle: "Check restricted-product availability",
  eligibilityPopupBody:
    "Tell us your age confirmation and shipping destination to preview whether restricted products may be available. This is not final legal approval.",
  eligibilityAgeConfirmationText: "Date of birth is required for restricted items.",
  eligibilityStateLabel: "Shipping state",
  eligibilityZipLabel: "ZIP code",
  eligibilityAcknowledgementText:
    "I understand restricted products may be unavailable or require additional verification before payment.",
};
