import { brand } from "@/lib/config/brand";
import { products as mockProducts, complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { expectedRestrictedStateRuleCount, restrictedRestrictedClass, unsafeDestinationOutcomes, usStateAndDcCodes } from "@/lib/compliance/restricted-state-rules";

export type CatalogContentSection = { sectionKey: string; eyebrow?: string; title: string; body?: string; imageUrl?: string; videoUrl?: string; ctaLabel?: string; ctaHref?: string; sortOrder: number };
export type CatalogIncludedItem = { label: string; description?: string; quantity: number; sortOrder: number };
export type CatalogSpec = { label: string; value: string; group?: string; sortOrder: number };
export type CatalogFAQ = { question: string; answer: string; sortOrder: number };

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
  category: { id: string; slug: string; name: string; status: string; archivedAt: Date | null; taxCode: string | null } | null;
  restrictedClass: string | null;
  taxCode: string | null;
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
  contentSections: Array<{ sectionKey: string; eyebrow: string | null; title: string; body: string | null; imageUrl: string | null; videoUrl: string | null; ctaLabel: string | null; ctaHref: string | null; sortOrder: number }>;
  includedItems: Array<{ label: string; description: string | null; quantity: number; sortOrder: number }>;
  specs: Array<{ label: string; value: string; group: string | null; sortOrder: number }>;
  faqs: Array<{ question: string; answer: string; sortOrder: number }>;
};

type StateRestrictionRuleRow = {
  stateCode: string;
  restrictedClass: string;
  outcome: string;
  reviewStatus: string;
  reason: string;
};

type ProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: { id: string; slug: string; name: string; status: string; archivedAt: Date | null; taxCode: string | null } | null;
  restrictedClass: string | null;
  taxCode: string | null;
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
  contentSections: CatalogContentSection[];
  includedItems: CatalogIncludedItem[];
  specs: CatalogSpec[];
  faqs: CatalogFAQ[];
};

type RestrictionRuleRow = {
  stateCode: string;
  restrictedClass: string;
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
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryTaxCode?: string | null;
  restrictedClass?: string | null;
  taxCode?: string | null;
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
  contentSections: CatalogContentSection[];
  includedItems: CatalogIncludedItem[];
  specs: CatalogSpec[];
  faqs: CatalogFAQ[];
};

const fallbackProducts: CatalogProduct[] = mockProducts.map((p) => ({
  ...p,
  variantId: p.id,
  brand: brand.name,
  reserved: Math.min(4, p.stock),
  features: [],
  media: [],
  contentSections: [],
  includedItems: [],
  specs: [],
  faqs: [],
}));

export const storefrontCategories = [
  { value: "all", label: "All products" },
  { value: "personal-safety-alarms", label: "Personal Safety Alarms" },
  { value: "training", label: "Training" },
  { value: "stun-guns", label: "Stun Guns" },
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
    String(product.category ?? ""),
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
    if (category && product.categorySlug !== category) return false;
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
      ...(category ? { category: { slug: category, status: "ACTIVE", archivedAt: null } } : {}),
    },
    include: {
      variants: { include: { inventory: true } },
      features: true,
      media: { orderBy: { sortOrder: "asc" } },
      contentSections: { where: { status: "ACTIVE", archivedAt: null }, orderBy: { sortOrder: "asc" } },
      includedItems: { where: { status: "ACTIVE", archivedAt: null }, orderBy: { sortOrder: "asc" } },
      specs: { where: { status: "ACTIVE", archivedAt: null }, orderBy: { sortOrder: "asc" } },
      faqs: { where: { status: "ACTIVE", archivedAt: null }, orderBy: { sortOrder: "asc" } },
      category: true,
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
      category: product.category?.name ?? "Uncategorized",
      categoryId: product.category?.id ?? null,
      categorySlug: product.category?.slug ?? null,
      categoryTaxCode: product.category?.taxCode ?? null,
      restrictedClass: product.restrictedClass ?? null,
      taxCode: product.taxCode ?? null,
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
      contentSections: product.contentSections.map((section) => ({ sectionKey: section.sectionKey, eyebrow: section.eyebrow ?? undefined, title: section.title, body: section.body ?? undefined, imageUrl: section.imageUrl ?? undefined, videoUrl: section.videoUrl ?? undefined, ctaLabel: section.ctaLabel ?? undefined, ctaHref: section.ctaHref ?? undefined, sortOrder: section.sortOrder })),
      includedItems: product.includedItems.map((item) => ({ label: item.label, description: item.description ?? undefined, quantity: item.quantity, sortOrder: item.sortOrder })),
      specs: product.specs.map((spec) => ({ label: spec.label, value: spec.value, group: spec.group ?? undefined, sortOrder: spec.sortOrder })),
      faqs: product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder })),
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

export type RuleCoverageSummary = {
  expectedStates: number;
  totalStateRulesFound: number;
  blockCount: number;
  allowCount: number;
  missingCount: number;
  unsafeOutcomeCount: number;
  allowWithoutNotesCount: number;
  mockFallbackActive: boolean;
};

export async function getRuleCoverageSummary(): Promise<RuleCoverageSummary> {
  if (!isDatabaseConfigured) {
    const blockCount = complianceRules.filter((rule) => rule.outcome === "blocked").length;
    const allowCount = complianceRules.filter((rule) => rule.outcome === "allowed").length;
    return {
      expectedStates: expectedRestrictedStateRuleCount,
      totalStateRulesFound: complianceRules.filter((rule) => rule.category === restrictedRestrictedClass && rule.coverage !== "missing").length,
      blockCount,
      allowCount,
      missingCount: expectedRestrictedStateRuleCount,
      unsafeOutcomeCount: 0,
      allowWithoutNotesCount: allowCount,
      mockFallbackActive: true,
    };
  }

  const rules = await prisma.stateRestrictionRule.findMany({
    where: { archivedAt: null, restrictedClass: restrictedRestrictedClass as never },
    select: { id: true, stateCode: true, outcome: true, legalSourceNote: true },
  }) as Array<{ id: string; stateCode: string; outcome: string; legalSourceNote?: string }>;
  const auditLogs = (await prisma.auditLog.findMany({
    where: { entityType: "StateRestrictionRule", entityId: { in: rules.filter((rule) => rule.outcome === "ALLOW").map((rule) => rule.id) } },
    select: { entityId: true, note: true },
  })) as Array<{ entityId: string; note: string }>;
  const statesFound = new Set(rules.map((rule) => rule.stateCode));
  const missingCount = usStateAndDcCodes.filter((state) => !statesFound.has(state)).length;
  const allowWithoutNotesCount = rules.filter((rule) => {
    if (rule.outcome !== "ALLOW") return false;
    const hasAuditNote = auditLogs.some((log) => log.entityId === rule.id && log.note.trim());
    return !rule.legalSourceNote?.trim() || !hasAuditNote;
  }).length;

  return {
    expectedStates: expectedRestrictedStateRuleCount,
    totalStateRulesFound: statesFound.size,
    blockCount: rules.filter((rule) => rule.outcome === "BLOCK").length,
    allowCount: rules.filter((rule) => rule.outcome === "ALLOW").length,
    missingCount,
    unsafeOutcomeCount: rules.filter((rule) => unsafeDestinationOutcomes.includes(rule.outcome as never)).length,
    allowWithoutNotesCount,
    mockFallbackActive: false,
  };
}

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
    orderBy: [{ restrictedClass: "asc" }, { stateCode: "asc" }],
  });
  const coverageRows: RuleCoverageRow[] = rows.map((rule: StateRestrictionRuleRow) => ({
    state: rule.stateCode,
    category: rule.restrictedClass,
    outcome: rule.outcome,
    coverage:
      unsafeDestinationOutcomes.includes(rule.outcome as never) || rule.reviewStatus === "MANUAL_REVIEW" ? "review_needed" : "covered",
    note: rule.reason,
  }));
  const coveredStates = new Set(coverageRows.filter((row) => row.category === restrictedRestrictedClass).map((row) => row.state));
  return [
    ...coverageRows,
    ...usStateAndDcCodes
      .filter((state) => !coveredStates.has(state))
      .map((state) => ({
        state,
        category: restrictedRestrictedClass,
        outcome: "BLOCK",
        coverage: "missing",
        note: "Missing rule: checkout fails closed and launch gate remains blocked.",
      })),
  ];
}
