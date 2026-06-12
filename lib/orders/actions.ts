"use server";

import { redirect } from "next/navigation";
import { createMockOrderFromCart, saveShippingDraft } from "@/lib/orders/order-service";

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

  redirect("/checkout/verification?case=ready_for_payment");
}

export async function createMockOrderAction() {
  const order = await createMockOrderFromCart();
  redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
}
