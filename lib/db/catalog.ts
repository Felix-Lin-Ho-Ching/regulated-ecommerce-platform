import { brand } from "@/lib/config/brand";
import { products as mockProducts, complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type CatalogProductMedia = {
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  sortOrder: number;
};

type CatalogProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  status: string;
  restricted: boolean;
  variants: Array<{
    id: string;
    sku: string;
    priceCents: number;
    inventory: {
      onHand: number;
      reserved: number;
    } | null;
  }>;
  features: Array<{
    code: string;
    label: string;
    value: string;
    restrictedRelevant: boolean;
  }>;
  media: Array<{
    type: "IMAGE" | "VIDEO";
    url: string;
    thumbnailUrl: string | null;
    alt: string | null;
    title: string | null;
    sortOrder: number;
  }>;
};

type StateRestrictionRuleRow = {
  stateCode: string;
  productCategory: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
};

type ProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  status: string;
  restricted: boolean;
  variants: Array<{
    id: string;
    sku: string;
    priceCents: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
  features: Array<{
    code: string;
    label: string;
    value: string;
    restrictedRelevant: boolean;
  }>;
  media: CatalogProductMedia[];
};

type RestrictionRuleRow = {
  stateCode: string;
  productCategory: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  status: string;
  restricted: boolean;
  variantId: string;
  sku: string;
  price: number;
  stock: number;
  reserved: number;
  features: Array<{
    code: string;
    label: string;
    value: string;
    restrictedRelevant: boolean;
  }>;
  media: CatalogProductMedia[];
};

const fallbackProducts: CatalogProduct[] = mockProducts.map((p) => ({
  ...p,
  variantId: p.id,
  brand: brand.name,
  reserved: Math.min(4, p.stock),
  features: [],
  media: [],
}));

export const storefrontCategories = [
  { value: "all", label: "All products" },
  { value: "personal_safety_alarm", label: "Personal safety alarm" },
  { value: "training", label: "Training" },
  { value: "knuckle_stun_device", label: "Self-defense devices" },
  { value: "visibility", label: "Visibility" },
] as const;

const storefrontVisibleStatuses = ["ACTIVE", "RESTRICTED_REVIEW"] as const;
const storefrontCategoryValues = storefrontCategories.map(
  (category) => category.value,
);

export type CatalogProductFilters = {
  q?: string;
  category?: string;
};

function normalizeSearchTerm(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeCategoryFilter(value?: string) {
  const category = value?.trim() ?? "";
  if (!category || category === "all") return undefined;
  return storefrontCategoryValues.includes(
    category as (typeof storefrontCategoryValues)[number],
  )
    ? category
    : undefined;
}

function isStorefrontVisible(product: Pick<CatalogProduct, "status">) {
  return storefrontVisibleStatuses.includes(
    product.status.toUpperCase() as (typeof storefrontVisibleStatuses)[number],
  );
}

function productMatchesSearch(product: CatalogProduct, q: string) {
  if (!q) return true;

  const searchableValues = [
    product.name,
    product.brand,
    product.category,
    product.description,
    product.sku,
    ...product.features.flatMap((feature) => [feature.label, feature.value]),
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(q));
}

function applyCatalogFilters(
  products: CatalogProduct[],
  filters?: CatalogProductFilters,
) {
  const q = normalizeSearchTerm(filters?.q);
  const category = normalizeCategoryFilter(filters?.category);

  return products.filter((product) => {
    if (!isStorefrontVisible(product)) return false;
    if (category && product.category !== category) return false;
    return productMatchesSearch(product, q);
  });
}

export async function getCatalogProducts(
  filters?: CatalogProductFilters,
): Promise<CatalogProduct[]> {
  if (!isDatabaseConfigured)
    return applyCatalogFilters(fallbackProducts, filters);
  const category = normalizeCategoryFilter(filters?.category);
  const rows = await prisma.product.findMany({
    where: {
      archivedAt: null,
      status: { in: [...storefrontVisibleStatuses] },
      ...(category ? { category } : {}),
    },
    include: {
      variants: { include: { inventory: true } },
      features: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  const products = rows.map((product: CatalogProductRow) => {
    const variant = product.variants[0];
    return {
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      category: product.category,
      description: product.description,
      status: product.status,
      restricted: product.restricted,
      variantId: variant?.id ?? product.id,
      sku: variant?.sku ?? "UNASSIGNED",
      price: (variant?.priceCents ?? 0) / 100,
      stock: Math.max(
        0,
        (variant?.inventory?.onHand ?? 0) - (variant?.inventory?.reserved ?? 0),
      ),
      reserved: variant?.inventory?.reserved ?? 0,
      features: product.features.map(
        (feature: CatalogProductRow["features"][number]) => ({
          code: feature.code,
          label: feature.label,
          value: feature.value,
          restrictedRelevant: feature.restrictedRelevant,
        }),
      ),
      media: product.media.map((media) => ({
        type: media.type,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl ?? undefined,
        alt: media.alt ?? undefined,
        title: media.title ?? undefined,
        sortOrder: media.sortOrder,
      })),
    };
  });

  return applyCatalogFilters(products, filters);
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<CatalogProduct | undefined> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug);
}

export type RuleCoverageRow = {
  state: string;
  category: string;
  outcome: string;
  coverage: string;
  note: string;
};

export async function getRuleCoverageRows(): Promise<RuleCoverageRow[]> {
  if (!isDatabaseConfigured)
    return complianceRules.map((rule) => ({
      state: rule.state,
      category: rule.category,
      outcome: rule.outcome,
      coverage: rule.coverage,
      note: rule.note,
    }));
  const rows = await prisma.stateRestrictionRule.findMany({
    where: { archivedAt: null },
    orderBy: [{ productCategory: "asc" }, { stateCode: "asc" }],
  });
  return rows.map((rule: StateRestrictionRuleRow) => ({
    state: rule.stateCode,
    category: rule.productCategory,
    outcome: rule.outcome,
    coverage:
      rule.reviewStatus === "MANUAL_REVIEW" ? "review_needed" : "covered",
    note: rule.reason,
  }));
}
