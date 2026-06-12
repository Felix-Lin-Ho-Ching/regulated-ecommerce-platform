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
  announcementBarText:
    "Restricted-product eligibility is reviewed before payment; live checkout remains disabled in this phase.",
  featuredSectionEyebrow: "Featured products",
  featuredSectionTitle: "Shop Stun Fry picks",
  trustComplianceTitle: "Compliance stays clear after you start shopping.",
  trustComplianceBody:
    "Stun Fry keeps restricted-product warnings visible. Eligibility, document review, and admin review remain checkpoints before any payment can happen.",
  trustBadgeLabels: ["In-stock picks", "Clear product labels", "Responsible checkout"],
};
