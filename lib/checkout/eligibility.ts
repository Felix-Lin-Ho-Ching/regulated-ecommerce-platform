import { complianceRules } from "@/lib/mock-data";
import type { CartSnapshot } from "@/lib/cart/cart-service";
import { evaluateEligibilityWithRules, type EligibilityRule } from "@/lib/eligibility/rules";

export type CheckoutDestinationStatus = "pending" | "allowed" | "blocked" | "uncertain";

export type CheckoutDestinationResult = {
  status: CheckoutDestinationStatus;
  message: string;
};

function completeDestination(state?: string, postalCode?: string) {
  return Boolean(state?.trim() && postalCode?.trim());
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

export function getRestrictedCategory(cart: CartSnapshot) {
  return cart.lines.find((line) => line.product.restricted)?.product.category;
}
