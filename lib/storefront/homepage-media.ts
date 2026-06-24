import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type HomepageMediaType = "IMAGE" | "VIDEO";

export type HomepageHeroMedia = {
  id: string;
  slot: string;
  type: HomepageMediaType;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  enabled: boolean;
  sortOrder: number;
};

export const defaultHomepageHeroMedia: HomepageHeroMedia = {
  id: "default-hero",
  slot: "hero",
  type: "IMAGE",
  url: "https://placehold.co/1200x900/123a42/f8f6f1?text=Everyday+Preparedness",
  thumbnailUrl: "https://placehold.co/1200x900/123a42/f8f6f1?text=Everyday+Preparedness",
  alt: "Calm everyday carry essentials arranged near a bag and keys",
  title: "Prepared when the walk home feels different.",
  subtitle: "Compact self-defense tools for people who want one extra layer of protection, without overcomplicating it.",
  ctaLabel: "Shop devices",
  ctaHref: "/products",
  enabled: true,
  sortOrder: 0,
};

type HomepageMediaRow = Omit<HomepageHeroMedia, "thumbnailUrl" | "alt" | "title" | "subtitle" | "ctaLabel" | "ctaHref"> & {
  thumbnailUrl: string | null;
  alt: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

function normalize(row: HomepageMediaRow | null | undefined): HomepageHeroMedia | null {
  if (!row) return null;
  return {
    id: row.id,
    slot: row.slot,
    type: row.type,
    url: row.url,
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    alt: row.alt ?? undefined,
    title: row.title ?? undefined,
    subtitle: row.subtitle ?? undefined,
    ctaLabel: row.ctaLabel ?? undefined,
    ctaHref: row.ctaHref ?? undefined,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
  };
}

export async function getHomepageHeroMedia(): Promise<HomepageHeroMedia | null> {
  if (!isDatabaseConfigured) return defaultHomepageHeroMedia;
  const row = await prisma.homepageMedia.findFirst({
    where: { slot: "hero", enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return normalize(row as HomepageMediaRow | null);
}

export async function getHomepageHeroMediaForAdmin(): Promise<HomepageHeroMedia> {
  if (!isDatabaseConfigured) return defaultHomepageHeroMedia;
  const row = await prisma.homepageMedia.findFirst({ where: { slot: "hero" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return normalize(row as HomepageMediaRow | null) ?? { ...defaultHomepageHeroMedia, id: "new", enabled: false, url: "" };
}

export async function upsertHomepageHeroMedia(media: HomepageHeroMedia): Promise<void> {
  if (!isDatabaseConfigured) return;
  const data = {
    slot: "hero",
    type: media.type,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl || null,
    alt: media.alt || null,
    title: media.title || null,
    subtitle: media.subtitle || null,
    ctaLabel: media.ctaLabel || null,
    ctaHref: media.ctaHref || null,
    enabled: media.enabled,
    sortOrder: 0,
  };
  const existing = await prisma.homepageMedia.findFirst({ where: { slot: "hero" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (existing) await prisma.homepageMedia.update({ where: { id: existing.id }, data });
  else await prisma.homepageMedia.create({ data });
}
