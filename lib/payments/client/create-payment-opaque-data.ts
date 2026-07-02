export type PaymentBillingAddress = { firstName: string; lastName: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone?: string };
export type PaymentOpaqueData = { dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT"; dataValue: string };
export type CardSummary = { brand: string; last4: string; expMonth: string; expYear: string };
const approvedCards = new Set(["4111111111111111", "4007000000027", "5424000000000015", "370000000000002", "6011000000000012"]);
function digits(value = "") { return value.replace(/\D/g, ""); }
function brand(number: string) { if (number.startsWith("4")) return "Visa"; if (number.startsWith("5")) return "Mastercard"; if (number.startsWith("37")) return "American Express"; if (number.startsWith("6")) return "Discover"; return "Card"; }
function luhn(number: string) { let sum = 0; let doubleIt = false; for (let i = number.length - 1; i >= 0; i--) { let n = Number(number[i]); if (doubleIt) { n *= 2; if (n > 9) n -= 9; } sum += n; doubleIt = !doubleIt; } return number.length >= 12 && sum % 10 === 0; }
function parseExpiration(month: string, year: string) { const mm = digits(month).padStart(2, "0").slice(0, 2); const yyyy = digits(year).length === 2 ? `20${digits(year)}` : digits(year).slice(0, 4); return { mm, yyyy }; }
function expired(month: string, year: string) { const mm = Number(month); const yyyy = Number(year); if (mm < 1 || mm > 12 || yyyy < 2000) return true; return new Date(yyyy, mm, 0, 23, 59, 59, 999) < new Date(); }
function encode(value: unknown) { const json = JSON.stringify(value); if (typeof window === "undefined") return Buffer.from(json).toString("base64url"); return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
export function createPaymentOpaqueData(input: { cardNumber: string; expirationMonth: string; expirationYear: string; cvv: string; nameOnCard: string; billingAddress: PaymentBillingAddress }): { opaqueData: PaymentOpaqueData; cardSummary: CardSummary } {
  const cardNumber = digits(input.cardNumber); const exp = parseExpiration(input.expirationMonth, input.expirationYear); const cardSummary = { brand: brand(cardNumber), last4: cardNumber.slice(-4), expMonth: exp.mm, expYear: exp.yyyy };
  const tokenPayload = { emulator: "authorize-net-acceptjs-local-v1", card: cardSummary, validation: { hasRequiredCardFields: Boolean(cardNumber && input.cvv.trim() && input.nameOnCard.trim()), luhnValid: luhn(cardNumber), approvedTestCard: approvedCards.has(cardNumber), expired: expired(exp.mm, exp.yyyy), cvvMismatch: input.cvv.trim() === "901" }, issuedAt: new Date().toISOString() };
  return { opaqueData: { dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT", dataValue: encode(tokenPayload) }, cardSummary };
}
