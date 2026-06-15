"use server";

import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { evaluateEligibilityFromConfiguredRules } from "@/lib/eligibility/rules";
import { createMockOrderFromCart, saveShippingDraft } from "@/lib/orders/order-service";

function required(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function isAdult(year: string, month: string, day: string) {
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  const adultDate = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return adultDate <= today;
}

export async function submitCheckoutAction(formData: FormData) {
  const cart = await getCartSnapshot();
  if (cart.lines.length === 0) redirect("/cart");

  const email = required(formData, "email");
  const name = required(formData, "name");
  const line1 = required(formData, "line1");
  const line2 = required(formData, "line2") || undefined;
  const city = required(formData, "city");
  const state = required(formData, "state").toUpperCase();
  const postalCode = required(formData, "postalCode");
  const phone = required(formData, "phone") || undefined;

  if (!email || !name || !line1 || !city || !state || !postalCode) {
    redirect("/checkout?error=address");
  }

  await saveShippingDraft({ name, line1, line2, city, state, postalCode, phone });

  const restrictedLine = cart.lines.find((line) => line.product.restricted);
  if (restrictedLine) {
    const adult = isAdult(required(formData, "dobYear"), required(formData, "dobMonth"), required(formData, "dobDay"));
    const attested = formData.get("ageAttestation") === "on";
    const eligibility = await evaluateEligibilityFromConfiguredRules({
      state,
      zip: postalCode,
      isAtLeast18: adult && attested,
      productCategory: restrictedLine.product.category,
      restricted: true,
    });

    if (eligibility.status === "blocked") redirect("/checkout?error=blocked");
    if (eligibility.status !== "available") redirect("/checkout?error=verification");
  }

  const order = await createMockOrderFromCart();
  redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
}
