"use server";

import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { evaluateCheckoutDestinationFromConfiguredRules } from "@/lib/checkout/eligibility";
import { createOrderRequestFromCart, saveShippingDraft } from "@/lib/orders/order-service";
import { calculateCheckoutTax } from "@/lib/tax/tax-service";
import { isValidUsStateCode, normalizeUsStateCode } from "@/lib/checkout/us-states";

function required(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function isAdult(dobValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobValue);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dob = new Date(year, month - 1, day);
  if (Number.isNaN(dob.getTime()) || dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day || year < 1900) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return false;
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
      restrictedClass: line.product.restrictedClass ?? undefined,
      productId: line.product.id,
      state,
      postalCode,
    });
    if (destination.status !== "allowed") return destination;
  }

  return { status: "allowed" as const, message: "Standard shipping is available." };
}

export async function estimateCheckoutTaxAction(address: { line1?: string; city?: string; state?: string; postalCode?: string }) {
  const cart = await getCartSnapshot();
  if (!address.line1 || !address.city || !address.state || !address.postalCode || cart.lines.length === 0) return { ok: false as const, error: "Enter a complete shipping address." };
  const destination = await evaluateCheckoutDestinationAction({ state: address.state, postalCode: address.postalCode });
  if (destination.status !== "allowed") return { ok: false as const, error: destination.message };
  try {
    const shippingCents = Math.round(cart.shipping * 100);
    const tax = await calculateCheckoutTax({
      toAddress: { line1: address.line1, city: address.city, state: address.state.toUpperCase().slice(0, 2), postalCode: address.postalCode, country: "US" },
      shippingCents,
      lineItems: cart.lines.map((line) => ({ id: line.product.variantId, productId: line.product.id, sku: line.product.sku, name: line.product.name, quantity: line.quantity, unitPriceCents: Math.round(line.product.price * 100), productTaxCode: line.product.taxCode, categoryTaxCode: line.product.categoryTaxCode })),
    });
    return { ok: true as const, taxCents: tax.taxCents, provider: tax.provider, totalCents: Math.round(cart.subtotal * 100) + shippingCents + tax.taxCents };
  } catch {
    return { ok: false as const, error: "Tax calculation is unavailable. Payment is blocked until tax can be calculated." };
  }
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
  const state = normalizeUsStateCode(required(formData, "state"));
  const postalCode = required(formData, "postalCode");
  const phone = required(formData, "phone") || undefined;

  if (!email || !firstName || !lastName || !line1 || !city || !state || !postalCode || !isValidUsStateCode(state)) {
    redirect("/checkout?error=address");
  }

  await saveShippingDraft({ name, line1, line2, city, state, postalCode, phone });

  const billingSame = formData.get("billingSame") === "on";
  const billingState = billingSame ? state : normalizeUsStateCode(required(formData, "billingState"));
  const billingAddress = billingSame ? { name, line1, line2, city, state, postalCode, phone } : {
    name: `${required(formData, "billingFirstName")} ${required(formData, "billingLastName")}`.trim(),
    line1: required(formData, "billingLine1"),
    line2: required(formData, "billingLine2") || undefined,
    city: required(formData, "billingCity"),
    state: billingState,
    postalCode: required(formData, "billingPostalCode"),
  };
  if (!billingSame && (!billingAddress.name || !billingAddress.line1 || !billingAddress.city || !billingAddress.postalCode || !isValidUsStateCode(billingState))) redirect("/checkout?error=address");
  const opaqueData = { dataDescriptor: required(formData, "opaqueDataDescriptor"), dataValue: required(formData, "opaqueDataValue") };
  if (opaqueData.dataDescriptor !== "COMMON.ACCEPT.INAPP.PAYMENT" || !opaqueData.dataValue) redirect("/checkout?error=address");
  let cardSummary;
  try { cardSummary = JSON.parse(required(formData, "cardSummary")); } catch { redirect("/checkout?error=address"); }

  const restrictedLines = cart.lines.filter((line) => line.product.restricted);
  if (restrictedLines.length > 0) {
    for (const restrictedLine of restrictedLines) {
      const destination = await evaluateCheckoutDestinationFromConfiguredRules({
        hasRestrictedItems: true,
        restrictedClass: restrictedLine.product.restrictedClass ?? undefined,
        productId: restrictedLine.product.id,
        state,
        postalCode,
      });
      if (destination.status !== "allowed") redirect("/checkout?error=blocked");
    }

    const adult = isAdult(required(formData, "dob"));
    if (!adult) redirect("/checkout?error=verification");
  }

  let order;
  try {
    order = await createOrderRequestFromCart({ opaqueData: opaqueData as any, cardSummary, billingAddress, shippingAddress: { name, line1, line2, city, state, postalCode, country: "US", phone }, customerEmail: email, customerName: name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be completed.";
    if (message.startsWith("Only ")) redirect(`/checkout?error=stock&message=${encodeURIComponent(message)}`);
    const safe = message.toLowerCase().includes("tax") ? "tax" : message.toLowerCase().includes("payment") || message.toLowerCase().includes("declined") || message.toLowerCase().includes("card") || message.toLowerCase().includes("cvv") || message.toLowerCase().includes("zip") ? "payment" : "blocked";
    redirect(`/checkout?error=${safe}`);
  }
  redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
}
