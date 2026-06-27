import type { CartSnapshot } from "@/lib/cart/cart-service";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { evaluateEligibilityWithRules, type EligibilityRule } from "@/lib/eligibility/rules";

export type CheckoutDestinationStatus = "pending" | "allowed" | "blocked";

export type CheckoutDestinationResult = {
  status: CheckoutDestinationStatus;
  message: string;
};

type DestinationRuleRow = {
  outcome: string;
  reason: string;
  productId: string | null;
};

function completeDestination(state?: string, postalCode?: string) {
  return Boolean(state?.trim() && postalCode?.trim());
}

export function normalizeDestinationState(state?: string) {
  return state?.trim().toUpperCase().slice(0, 2) ?? "";
}

export function normalizeDestinationPostalCode(postalCode?: string) {
  return postalCode?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
}

function zipCandidates(postalCode?: string) {
  const normalized = normalizeDestinationPostalCode(postalCode);
  const candidates = new Set<string>();
  if (normalized) candidates.add(normalized);
  const firstFive = normalized.match(/^\d{5}/)?.[0];
  if (firstFive) candidates.add(firstFive);
  return [...candidates];
}

function resultFromOutcome(rule?: Pick<DestinationRuleRow, "outcome"> | null): CheckoutDestinationResult {
  if (rule?.outcome === "ALLOW") {
    return { status: "allowed", message: "Standard shipping is available." };
  }

  return { status: "blocked", message: "This item is not available for your shipping destination." };
}

function chooseProductRule<T extends { productId: string | null }>(rules: T[], productId?: string) {
  return rules.find((rule) => productId && rule.productId === productId) ?? rules.find((rule) => !rule.productId) ?? null;
}

export function evaluateCheckoutDestination({
  hasRestrictedItems,
  productCategory,
  productId,
  state,
  postalCode,
  rules = [],
}: {
  hasRestrictedItems: boolean;
  productCategory?: string;
  productId?: string;
  state?: string;
  postalCode?: string;
  rules?: EligibilityRule[];
}): CheckoutDestinationResult {
  if (!completeDestination(state, postalCode)) {
    return { status: "pending", message: "Enter your shipping address to view available shipping methods." };
  }

  if (!hasRestrictedItems) {
    return { status: "allowed", message: "Standard shipping is available." };
  }

  const result = evaluateEligibilityWithRules(
    {
      state,
      zip: postalCode,
      isAtLeast18: true,
      productCategory,
      productId,
      restricted: true,
    },
    rules,
  );

  return result.status === "available" ? resultFromOutcome({ outcome: "ALLOW" }) : resultFromOutcome(null);
}

export async function evaluateCheckoutDestinationFromConfiguredRules({
  hasRestrictedItems,
  productCategory = "knuckle_stun_device",
  productId,
  state,
  postalCode,
}: {
  hasRestrictedItems: boolean;
  productCategory?: string;
  productId?: string;
  state?: string;
  postalCode?: string;
}): Promise<CheckoutDestinationResult> {
  if (!completeDestination(state, postalCode)) {
    return { status: "pending", message: "Enter your shipping address to view available shipping methods." };
  }

  if (!hasRestrictedItems) {
    return { status: "allowed", message: "Standard shipping is available." };
  }

  if (!isDatabaseConfigured) {
    if (process.env.NODE_ENV === "production") {
      return resultFromOutcome(null);
    }
    return resultFromOutcome(null);
  }

  const stateCode = normalizeDestinationState(state);
  const zips = zipCandidates(postalCode);
  const productScope = productId ? [{ productId }, { productId: null }] : [{ productId: null }];

  const localRules = (await prisma.localRestrictionRule.findMany({
    where: {
      archivedAt: null,
      stateCode,
      productCategory: productCategory as never,
      localityType: "ZIP",
      OR: productScope,
    },
    orderBy: { createdAt: "desc" },
    select: { outcome: true, reason: true, productId: true, localityName: true },
  })) as Array<DestinationRuleRow & { localityName: string }>;

  const matchingLocalRules = localRules.filter((rule) => zips.includes(normalizeDestinationPostalCode(rule.localityName)));
  const localRule = chooseProductRule(matchingLocalRules, productId);
  if (localRule) return resultFromOutcome(localRule);

  const stateRules = (await prisma.stateRestrictionRule.findMany({
    where: {
      archivedAt: null,
      stateCode,
      productCategory: productCategory as never,
      OR: productScope,
    },
    orderBy: { createdAt: "desc" },
    select: { outcome: true, reason: true, productId: true },
  })) as DestinationRuleRow[];

  return resultFromOutcome(chooseProductRule(stateRules, productId));
}

export function getRestrictedCategory(cart: CartSnapshot) {
  return cart.lines.find((line) => line.product.restricted)?.product.category;
}

export function getRestrictedProductId(cart: CartSnapshot) {
  return cart.lines.find((line) => line.product.restricted)?.product.id;
}
