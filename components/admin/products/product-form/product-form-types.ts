export type Item<T> = T & { key: string; editing?: boolean; isNew?: boolean };

export type MediaItem = Item<{
  type: "IMAGE" | "YOUTUBE";
  url?: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
}>;
export type SectionItem = Item<{
  sectionKey?: string;
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
}>;
export type FeatureItem = Item<{
  code?: string | null;
  label?: string | null;
  value?: string | null;
  restrictedRelevant?: boolean;
}>;
export type IncludedItem = Item<{
  label?: string | null;
  description?: string | null;
  quantity?: number | null;
}>;
export type SpecItem = Item<{ group?: string | null; label?: string | null; value?: string | null }>;
export type FaqItem = Item<{ question?: string | null; answer?: string | null }>;
