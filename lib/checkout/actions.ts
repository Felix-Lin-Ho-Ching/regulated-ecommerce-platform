"use server";

import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { evaluateCheckoutDestinationFromConfiguredRules } from "@/lib/checkout/eligibility";
import { createOrderRequestFromCart, saveShippingDraft } from "@/lib/orders/order-service";

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

export async function evaluateCheckoutDestinationAction({ state, postalCode }: { state?: string; postalCode?: string }) {
  const cart = await getCartSnapshot();
  const restrictedLines = cart.lines.filter((line) => line.product.restricted);

  if (restrictedLines.length === 0) {
    return evaluateCheckoutDestinationFromConfiguredRules({ hasRestrictedItems: false, state, postalCode });
  }

  for (const line of restrictedLines) {
    const destination = await evaluateCheckoutDestinationFromConfiguredRules({
      hasRestrictedItems: true,
      productCategory: line.product.category,
      productId: line.product.id,
      state,
      postalCode,
    });
    if (destination.status !== "allowed") return destination;
  }

  return { status: "allowed" as const, message: "Standard shipping is available." };
}

export async function submitCheckoutAction(formData: FormData) {
  const cart = await getCartSnapshot();
  if (cart.lines.length === 0) redirect("/cart");

  const email = required(formData, "email");
  const firstName = required(formData, "firstName");
  const lastName = required(formData, "lastName");
  const name = `${firstName} ${lastName}`.trim();
  const line1 = required(formData, "line1");
  const line2 = required(formData, "line2") || undefined;
  const city = required(formData, "city");
  const state = required(formData, "state").trim().toUpperCase().slice(0, 2);
  const postalCode = required(formData, "postalCode");
  const phone = required(formData, "phone") || undefined;

  if (!email || !firstName || !lastName || !line1 || !city || !state || !postalCode) {
    redirect("/checkout?error=address");
  }

  await saveShippingDraft({ name, line1, line2, city, state, postalCode, phone });

  const restrictedLines = cart.lines.filter((line) => line.product.restricted);
  if (restrictedLines.length > 0) {
    for (const restrictedLine of restrictedLines) {
      const destination = await evaluateCheckoutDestinationFromConfiguredRules({
        hasRestrictedItems: true,
        productCategory: restrictedLine.product.category,
        productId: restrictedLine.product.id,
        state,
        postalCode,
      });
      if (destination.status !== "allowed") redirect("/checkout?error=blocked");
    }

    const adult = isAdult(required(formData, "dobYear"), required(formData, "dobMonth"), required(formData, "dobDay"));
    const attested = formData.get("ageAttestation") === "on";
    if (!adult || !attested) redirect("/checkout?error=verification");
  }

  let order;
  try {
    order = await createOrderRequestFromCart();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be completed.";
    if (message.startsWith("Only ")) redirect(`/checkout?error=stock&message=${encodeURIComponent(message)}`);
    redirect("/checkout?error=blocked");
  }
  redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
}
