import { complianceRules } from "@/lib/mock-data";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { evaluateEligibilityWithRules, type EligibilityRule } from "@/lib/eligibility/rules";

export type CheckoutDestinationStatus = "pending" | "allowed" | "blocked" | "uncertain";

export type CheckoutDestinationResult = {
  status: CheckoutDestinationStatus;
  message: string;
};

type DestinationRuleRow = {
  outcome: string;
  reason: string;
};

function completeDestination(state?: string, postalCode?: string) {
  return Boolean(state?.trim() && postalCode?.trim());
}

function normalizeState(state?: string) {
  return state?.trim().toUpperCase().slice(0, 2) ?? "";
}

function normalizeZip(postalCode?: string) {
  return postalCode?.trim().toUpperCase() ?? "";
}

function resultFromOutcome(rule?: DestinationRuleRow | null): CheckoutDestinationResult {
  if (rule?.outcome === "ALLOW") {
    return { status: "allowed", message: "Standard shipping is available." };
  }

  return { status: "blocked", message: "This item is not available for your shipping destination." };
}

export function evaluateCheckoutDestination({
  hasRestrictedItems,
  productCategory,
  state,
  postalCode,
  rules = complianceRules,
}: {
  hasRestrictedItems: boolean;
  productCategory?: string;
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
      restricted: true,
    },
    rules,
  );

  if (result.status === "blocked") {
    return { status: "blocked", message: "This item is not available for your shipping destination." };
  }

  if (result.status === "available") {
    return { status: "allowed", message: "Standard shipping is available." };
  }

  return { status: "uncertain", message: "Additional restrictions may apply." };
}

export async function evaluateCheckoutDestinationFromConfiguredRules({
  hasRestrictedItems,
  productCategory = "knuckle_stun_device",
  state,
  postalCode,
}: {
  hasRestrictedItems: boolean;
  productCategory?: string;
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
    const destination = evaluateCheckoutDestination({ hasRestrictedItems, productCategory, state, postalCode });
    return destination.status === "allowed" ? destination : resultFromOutcome(null);
  }

  const stateCode = normalizeState(state);
  const zip = normalizeZip(postalCode);

  const localRule = (await prisma.localRestrictionRule.findFirst({
    where: {
      archivedAt: null,
      stateCode,
      productCategory: productCategory as never,
      localityType: "ZIP",
      localityName: zip,
    },
    orderBy: { createdAt: "desc" },
    select: { outcome: true, reason: true },
  })) as DestinationRuleRow | null;

  if (localRule) return resultFromOutcome(localRule);

  const stateRule = (await prisma.stateRestrictionRule.findFirst({
    where: {
      archivedAt: null,
      stateCode,
      productCategory: productCategory as never,
    },
    orderBy: { createdAt: "desc" },
    select: { outcome: true, reason: true },
  })) as DestinationRuleRow | null;

  return resultFromOutcome(stateRule);
}

export function getRestrictedCategory(cart: CartSnapshot) {
  return cart.lines.find((line) => line.product.restricted)?.product.category;
}
