"use server";

import { redirect } from "next/navigation";
import { createOrderRequestFromCart, getCheckoutEligibilitySnapshot, saveShippingDraft } from "@/lib/orders/order-service";

export async function saveShippingAction(formData: FormData) {
  const state = String(formData.get("state") || "TX").trim().toUpperCase();

  await saveShippingDraft({
    name: String(formData.get("name") || "").trim(),
    line1: String(formData.get("line1") || "").trim(),
    line2: String(formData.get("line2") || "").trim() || undefined,
    city: String(formData.get("city") || "").trim(),
    state,
    postalCode: String(formData.get("postalCode") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
  });

  redirect("/checkout/verification");
}

export async function createOrderRequestAction() {
  const eligibility = await getCheckoutEligibilitySnapshot(true);

  if (eligibility.result.status !== "available") {
    redirect("/checkout/verification");
  }

  redirect("/checkout");
}

export async function continueFromEligibilityAction(formData: FormData) {
  const isAtLeast18 = formData.get("isAtLeast18") === "on";
  const acknowledged = formData.get("acknowledged") === "on";

  const eligibility = await getCheckoutEligibilitySnapshot(isAtLeast18);

  if (eligibility.hasRestrictedItems && (!isAtLeast18 || !acknowledged)) {
    redirect("/checkout/verification?attestation=missing");
  }

  if (eligibility.result.status === "available") {
    redirect("/checkout/payment");
  }

  redirect("/checkout/verification?status=" + eligibility.result.status);
}
