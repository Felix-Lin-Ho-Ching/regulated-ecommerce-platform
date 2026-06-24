export const productStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED", "RESTRICTED_REVIEW"] as const;
export const productCategories = ["personal_safety_alarm", "training", "knuckle_stun_device", "visibility"] as const;

type ProductStatus = (typeof productStatuses)[number];
type ProductCategory = (typeof productCategories)[number];

export type ProductFeatureInput = {
  code: string;
  label: string;
  value: string;
  restrictedRelevant: boolean;
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
  auditNote: string;
};

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    auditNote: text(formData, "auditNote"),
  };
}
