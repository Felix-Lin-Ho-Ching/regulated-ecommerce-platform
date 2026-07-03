import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type HomepageMediaType = "IMAGE" | "VIDEO";

export type HomepageSlide = {
  id: string;
  slot: string;
  type: HomepageMediaType;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  badge1: string;
  badge2: string;
  badge3: string;
  enabled: boolean;
  sortOrder: number;
};

export const HERO_SLIDE_SLOT = "hero-slide";
export const HERO_SLIDE_MAX = 5;

export const defaultHomepageSlides: HomepageSlide[] = [
  {
    id: "default-slide-1",
    slot: HERO_SLIDE_SLOT,
    type: "IMAGE",
    url: "https://placehold.co/1800x1000/123a42/f8f6f1?text=Everyday+Preparedness",
    thumbnailUrl: "https://placehold.co/1800x1000/123a42/f8f6f1?text=Everyday+Preparedness",
    alt: "Calm everyday carry essentials arranged near a bag and keys",
    headline: "Prepared when the walk home feels different.",
    subheadline: "Compact self-defense tools for people who want one extra layer of protection, without overcomplicating it.",
    ctaLabel: "Shop devices",
    ctaHref: "/products",
    badge1: "Responsible ownership",
    badge2: "Secure order handling",
    badge3: "Verified at checkout",
    enabled: true,
    sortOrder: 0,
  },
  {
    id: "default-slide-2",
    slot: HERO_SLIDE_SLOT,
    type: "IMAGE",
    url: "https://placehold.co/1800x1000/f0ede6/164e52?text=Compact+Everyday+Tools",
    thumbnailUrl: "https://placehold.co/1800x1000/f0ede6/164e52?text=Compact+Everyday+Tools",
    alt: "Compact personal safety tools in a clean ecommerce layout",
    headline: "Simple tools for everyday preparedness.",
    subheadline: "Designed for people who want something compact, accessible, and easy to keep nearby.",
    ctaLabel: "View products",
    ctaHref: "/products",
    badge1: "Compact carry",
    badge2: "Clear product details",
    badge3: "Stock tracked",
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "default-slide-3",
    slot: HERO_SLIDE_SLOT,
    type: "IMAGE",
    url: "https://placehold.co/1800x1000/0f172a/f8f6f1?text=Responsible+Ordering",
    thumbnailUrl: "https://placehold.co/1800x1000/0f172a/f8f6f1?text=Responsible+Ordering",
    alt: "Responsible checkout and shipping eligibility review",
    headline: "Ships only where allowed.",
    subheadline: "We check shipping eligibility during checkout so restricted items are handled responsibly.",
    ctaLabel: "How ordering works",
    ctaHref: "#how-ordering-works",
    badge1: "Location checked",
    badge2: "Restricted item review",
    badge3: "Order request mode",
    enabled: true,
    sortOrder: 2,
  },
];

type HomepageMediaRow = {
  id: string; slot: string; type: HomepageMediaType; url: string; thumbnailUrl: string | null; alt: string | null; title: string | null; subtitle: string | null; ctaLabel: string | null; ctaHref: string | null; enabled: boolean; sortOrder: number;
};

function badgeValues(alt: string | null | undefined): [string, string, string] {
  const parts = (alt ?? "").split("|").map((part) => part.trim()).filter(Boolean);
  return [parts[0] ?? "Responsible ownership", parts[1] ?? "Secure order handling", parts[2] ?? "Verified at checkout"];
}

function normalize(row: HomepageMediaRow): HomepageSlide {
  const [badge1, badge2, badge3] = badgeValues(row.alt);
  return { id: row.id, slot: row.slot, type: row.type, url: row.url, thumbnailUrl: row.thumbnailUrl ?? undefined, alt: row.title ?? undefined, headline: row.title || defaultHomepageSlides[0].headline, subheadline: row.subtitle || defaultHomepageSlides[0].subheadline, ctaLabel: row.ctaLabel || "Shop devices", ctaHref: row.ctaHref || "/products", badge1, badge2, badge3, enabled: row.enabled, sortOrder: row.sortOrder };
}

export async function getHomepageSlides(): Promise<HomepageSlide[]> {
  if (!isDatabaseConfigured) return defaultHomepageSlides;
  const rows = await prisma.homepageMedia.findMany({ where: { slot: HERO_SLIDE_SLOT, enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: HERO_SLIDE_MAX });
  return rows.map((row: unknown) => normalize(row as HomepageMediaRow));
}

export async function getHomepageSlidesForAdmin(): Promise<HomepageSlide[]> {
  if (!isDatabaseConfigured) return defaultHomepageSlides;
  const rows = await prisma.homepageMedia.findMany({ where: { slot: HERO_SLIDE_SLOT }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return rows.map((row: unknown) => normalize(row as HomepageMediaRow));
}

export async function upsertHomepageSlide(slide: HomepageSlide): Promise<string> {
  if (!isDatabaseConfigured) return slide.id;
  const data = { slot: HERO_SLIDE_SLOT, type: slide.type, url: slide.url, thumbnailUrl: slide.thumbnailUrl || null, alt: [slide.badge1, slide.badge2, slide.badge3].filter(Boolean).join(" | "), title: slide.headline, subtitle: slide.subheadline, ctaLabel: slide.ctaLabel, ctaHref: slide.ctaHref, enabled: slide.enabled, sortOrder: slide.sortOrder };
  if (slide.id && slide.id !== "new") {
    await prisma.homepageMedia.update({ where: { id: slide.id }, data });
    return slide.id;
  }
  const created = await prisma.homepageMedia.create({ data });
  return created.id;
}

export async function deleteHomepageSlide(id: string): Promise<void> {
  if (!isDatabaseConfigured || !id || id === "new") return;
  await prisma.homepageMedia.delete({ where: { id } });
}
