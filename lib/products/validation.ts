export const productStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED", "RESTRICTED_REVIEW"] as const;
export const productCategories = ["personal_safety_alarm", "training", "knuckle_stun_device", "visibility"] as const;
export const productMediaTypes = ["IMAGE", "VIDEO"] as const;
export const maxProductMediaRows = 6;

type ProductStatus = (typeof productStatuses)[number];
type ProductCategory = (typeof productCategories)[number];
export type ProductMediaType = (typeof productMediaTypes)[number];

export type ProductFeatureInput = {
  code: string;
  label: string;
  value: string;
  restrictedRelevant: boolean;
};

export type ProductMediaInput = {
  type: ProductMediaType;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  sortOrder: number;
};

export type ProductFormInput = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  category: ProductCategory;
  description: string;
  status: ProductStatus;
  restricted: boolean;
  sku: string;
  priceCents: number;
  features: ProductFeatureInput[];
  media: ProductMediaInput[];
  auditNote: string;
};

export class ProductFormValidationError extends Error {}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(value: string, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function centsFromDollars(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function intOrDefault(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isValidMediaUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseMediaRows(formData: FormData): ProductMediaInput[] {
  const rows: Array<ProductMediaInput | undefined> = Array.from({ length: maxProductMediaRows }, (_, index) => {
    const type = oneOf(text(formData, `mediaType${index}`), productMediaTypes, "IMAGE");
    const url = text(formData, `mediaUrl${index}`);
    const thumbnailUrl = text(formData, `mediaThumbnailUrl${index}`);
    const alt = text(formData, `mediaAlt${index}`);
    const title = text(formData, `mediaTitle${index}`);
    const sortOrderValue = text(formData, `mediaSortOrder${index}`);
    const hasVisibleInput = Boolean(url || thumbnailUrl || alt || title || sortOrderValue);
    if (!hasVisibleInput) return undefined;
    if (!url) throw new ProductFormValidationError(`Media row ${index + 1}: URL is required when media details are provided.`);
    if (!isValidMediaUrl(url)) throw new ProductFormValidationError(`Media row ${index + 1}: enter a valid http(s) or local URL.`);
    if (thumbnailUrl && !isValidMediaUrl(thumbnailUrl)) throw new ProductFormValidationError(`Media row ${index + 1}: enter a valid thumbnail URL.`);
    return {
      type,
      url,
      thumbnailUrl: thumbnailUrl || undefined,
      alt: alt || undefined,
      title: title || undefined,
      sortOrder: sortOrderValue ? intOrDefault(sortOrderValue, index) : index,
    };
  });

  return rows.filter((media): media is ProductMediaInput => Boolean(media));
}

export function parseProductForm(formData: FormData): ProductFormInput {
  const name = text(formData, "name") || "Untitled product";
  const restricted = formData.get("restricted") === "on";

  return {
    id: text(formData, "id") || undefined,
    name,
    slug: slugify(text(formData, "slug") || name),
    brand: text(formData, "brand") || "Stun Fry",
    category: oneOf(text(formData, "category"), productCategories, "personal_safety_alarm"),
    description: text(formData, "description") || "Owner-managed product description pending.",
    status: oneOf(text(formData, "status"), productStatuses, "DRAFT"),
    restricted,
    sku: text(formData, "sku") || slugify(name).toUpperCase(),
    priceCents: centsFromDollars(text(formData, "price")),
    features: [0, 1, 2, 3, 4]
      .map((index) => ({
        code: text(formData, `featureCode${index}`),
        label: text(formData, `featureLabel${index}`),
        value: text(formData, `featureValue${index}`),
        restrictedRelevant: formData.get(`featureRestricted${index}`) === "on",
      }))
      .filter((feature) => feature.code || feature.label || feature.value)
      .filter((feature) => feature.code && feature.label),
    media: parseMediaRows(formData),
    auditNote: text(formData, "auditNote"),
  };
}
