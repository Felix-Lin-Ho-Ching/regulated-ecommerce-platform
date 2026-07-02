"use server";

import { redirect } from "next/navigation";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { evaluateCheckoutDestinationFromConfiguredRules } from "@/lib/checkout/eligibility";
import { createOrderRequestFromCart, saveShippingDraft } from "@/lib/orders/order-service";
import { calculateCheckoutTax } from "@/lib/tax/tax-service";
import type { PaymentAddress } from "@/lib/payments/gateways/authorize-net-types";
import type { CardSummary, PaymentOpaqueData } from "@/lib/payments/client/create-payment-opaque-data";

function required(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
function isAdult(year: string, month: string, day: string) { if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return false; const dob = new Date(Number(year), Number(month) - 1, Number(day)); if (Number.isNaN(dob.getTime()) || dob.getFullYear() !== Number(year) || dob.getMonth() !== Number(month) - 1 || dob.getDate() !== Number(day)) return false; return new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()) <= new Date(); }
function parseJson<T>(value: string): T | null { try { return JSON.parse(value) as T; } catch { return null; } }

export async function evaluateCheckoutDestinationAction({ state, postalCode }: { state?: string; postalCode?: string }) {
  const cart = await getCartSnapshot(); const restrictedLines = cart.lines.filter((line) => line.product.restricted);
  if (restrictedLines.length === 0) return evaluateCheckoutDestinationFromConfiguredRules({ hasRestrictedItems: false, state, postalCode });
  for (const line of restrictedLines) { const destination = await evaluateCheckoutDestinationFromConfiguredRules({ hasRestrictedItems: true, restrictedClass: line.product.restrictedClass ?? undefined, productId: line.product.id, state, postalCode }); if (destination.status !== "allowed") return destination; }
  return { status: "allowed" as const, message: "Standard shipping is available." };
}

export async function estimateCheckoutTaxAction(address: { line1?: string; city?: string; state?: string; postalCode?: string }) {
  const cart = await getCartSnapshot(); if (!address.line1 || !address.city || !address.state || !address.postalCode || cart.lines.length === 0) return { ok: false as const, error: "Enter a complete shipping address." };
  const destination = await evaluateCheckoutDestinationAction({ state: address.state, postalCode: address.postalCode }); if (destination.status !== "allowed") return { ok: false as const, error: destination.message };
  try { const shippingCents = Math.round(cart.shipping * 100); const tax = await calculateCheckoutTax({ toAddress: { line1: address.line1, city: address.city, state: address.state.toUpperCase().slice(0, 2), postalCode: address.postalCode, country: "US" }, shippingCents, lineItems: cart.lines.map((line) => ({ id: line.product.variantId, productId: line.product.id, sku: line.product.sku, name: line.product.name, quantity: line.quantity, unitPriceCents: Math.round(line.product.price * 100), productTaxCode: line.product.taxCode, categoryTaxCode: line.product.categoryTaxCode })) }); return { ok: true as const, taxCents: tax.taxCents, provider: tax.provider, totalCents: Math.round(cart.subtotal * 100) + shippingCents + tax.taxCents }; } catch { return { ok: false as const, error: "Tax calculation is unavailable. Payment is blocked until tax can be calculated." }; }
}

export async function submitCheckoutAction(formData: FormData) {
  const cart = await getCartSnapshot(); if (cart.lines.length === 0) redirect("/cart");
  const email = required(formData, "email"); const firstName = required(formData, "firstName"); const lastName = required(formData, "lastName"); const line1 = required(formData, "line1"); const line2 = required(formData, "line2") || undefined; const city = required(formData, "city"); const state = required(formData, "state").toUpperCase().slice(0, 2); const postalCode = required(formData, "postalCode"); const phone = required(formData, "phone") || undefined;
  if (!email || !firstName || !lastName || !line1 || !city || !state || !postalCode) redirect("/checkout?error=address");
  const shippingAddress: PaymentAddress = { firstName, lastName, line1, line2, city, state, postalCode, country: "US", phone };
  const billingSame = formData.get("billingSame") === "on";
  const billingAddress: PaymentAddress = billingSame ? shippingAddress : { firstName: required(formData, "billingFirstName"), lastName: required(formData, "billingLastName"), line1: required(formData, "billingLine1"), line2: required(formData, "billingLine2") || undefined, city: required(formData, "billingCity"), state: required(formData, "billingState").toUpperCase().slice(0, 2), postalCode: required(formData, "billingPostalCode"), country: "US", phone: required(formData, "billingPhone") || undefined };
  if (!billingAddress.firstName || !billingAddress.lastName || !billingAddress.line1 || !billingAddress.city || !billingAddress.state || !billingAddress.postalCode) redirect("/checkout?error=address");
  const opaqueData = parseJson<PaymentOpaqueData>(required(formData, "opaqueData")); const cardSummary = parseJson<CardSummary>(required(formData, "cardSummary"));
  if (!opaqueData?.dataValue || opaqueData.dataDescriptor !== "COMMON.ACCEPT.INAPP.PAYMENT" || !cardSummary?.last4) redirect("/checkout?error=address");
  await saveShippingDraft({ name: `${firstName} ${lastName}`.trim(), line1, line2, city, state, postalCode, phone });
  const restrictedLines = cart.lines.filter((line) => line.product.restricted);
  if (restrictedLines.length > 0) { for (const restrictedLine of restrictedLines) { const destination = await evaluateCheckoutDestinationFromConfiguredRules({ hasRestrictedItems: true, restrictedClass: restrictedLine.product.restrictedClass ?? undefined, productId: restrictedLine.product.id, state, postalCode }); if (destination.status !== "allowed") redirect("/checkout?error=blocked"); } if (!isAdult(required(formData, "dobYear"), required(formData, "dobMonth"), required(formData, "dobDay"))) redirect("/checkout?error=verification"); }
  try { const order = await createOrderRequestFromCart({ opaqueData, cardSummary, shippingAddress, billingAddress, customerEmail: email, dob: { month: required(formData, "dobMonth"), day: required(formData, "dobDay"), year: required(formData, "dobYear") } }); redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`); } catch (error) { const message = error instanceof Error ? error.message : "Checkout could not be completed."; if (message.startsWith("Only ")) redirect(`/checkout?error=stock&message=${encodeURIComponent(message)}`); const safe = message.toLowerCase().includes("tax") ? "tax" : "blocked"; redirect(`/checkout?error=${safe}`); }
}
