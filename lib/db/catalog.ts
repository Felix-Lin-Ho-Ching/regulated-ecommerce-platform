import { brand } from "@/lib/config/brand";
import { products as mockProducts, complianceRules } from "@/lib/mock-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type CatalogProductRow = Prisma.ProductGetPayload<{ include: { variants: { include: { inventory: true } }; features: true } }>;
type StateRestrictionRuleRow = Prisma.StateRestrictionRuleGetPayload<true>;


type ProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  status: string;
  restricted: boolean;
  variants: Array<{ sku: string; priceCents: number; inventory: { onHand: number; reserved: number } | null }>;
  features: Array<{ code: string; label: string; value: string; restrictedRelevant: boolean }>;
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
  sku: string;
  price: number;
  stock: number;
  reserved: number;
  features: Array<{ code: string; label: string; value: string; restrictedRelevant: boolean }>;
};

const fallbackProducts: CatalogProduct[] = mockProducts.map((p) => ({ ...p, brand: brand.name, reserved: Math.min(4, p.stock), features: [] }));

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  if (!isDatabaseConfigured) return fallbackProducts;
  const rows = (await prisma.product.findMany({
    where: { archivedAt: null },
    include: { variants: { include: { inventory: true } }, features: true },
    orderBy: { createdAt: "asc" },
  }));
  return rows.map((product: CatalogProductRow) => {
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
      sku: variant?.sku ?? "UNASSIGNED",
      price: (variant?.priceCents ?? 0) / 100,
      stock: variant?.inventory?.onHand ?? 0,
      reserved: variant?.inventory?.reserved ?? 0,
      features: product.features.map((feature: CatalogProductRow["features"][number]) => ({ code: feature.code, label: feature.label, value: feature.value, restrictedRelevant: feature.restrictedRelevant })),
    };
  });
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug);
}

export type RuleCoverageRow = { state: string; category: string; outcome: string; coverage: string; note: string };

export async function getRuleCoverageRows(): Promise<RuleCoverageRow[]> {
  if (!isDatabaseConfigured) return complianceRules.map((rule) => ({ state: rule.state, category: rule.category, outcome: rule.outcome, coverage: rule.coverage, note: rule.note }));
  const rows = await prisma.stateRestrictionRule.findMany({ where: { archivedAt: null }, orderBy: [{ productCategory: "asc" }, { stateCode: "asc" }] });
  return rows.map((rule: StateRestrictionRuleRow) => ({
    state: rule.stateCode,
    category: rule.productCategory,
    outcome: rule.outcome,
    coverage: rule.reviewStatus === "MANUAL_REVIEW" ? "review_needed" : "covered",
    note: rule.reason,
  }));
}
