import type { AuthorizeNetChargeRequest, AuthorizeNetChargeResponse } from "@/lib/payments/gateways/authorize-net-types";

const approvedCards = new Set(["4111111111111111", "4007000000027", "5424000000000015", "370000000000002", "6011000000000012"]);
function luhn(number: string) { let sum = 0; let doubleIt = false; for (let i = number.length - 1; i >= 0; i--) { let n = Number(number[i]); if (doubleIt) { n *= 2; if (n > 9) n -= 9; } sum += n; doubleIt = !doubleIt; } return number.length >= 12 && sum % 10 === 0; }
function expired(monthText: string, yearText: string) { const month = Number(monthText); const year = Number(yearText); if (month < 1 || month > 12 || year < 2000) return true; return new Date(year, month, 0, 23, 59, 59, 999) < new Date(); }
function readToken(dataValue: string) { if (!dataValue.startsWith("local-test-")) return null; try { return JSON.parse(Buffer.from(dataValue.slice("local-test-".length), "base64").toString("utf8")) as { cardNumber?: string; cvv?: string; expMonth?: string; expYear?: string; billingPostalCode?: string }; } catch { return null; } }
function response(request: AuthorizeNetChargeRequest, status: AuthorizeNetChargeResponse["status"], message: string, extras: Partial<AuthorizeNetChargeResponse> = {}): AuthorizeNetChargeResponse {
  const responseCode = status === "approved" ? "1" : status === "held_for_review" ? "4" : "2";
  const transId = `LOCAL-AUTHNET-${request.orderNumber}-${Date.now()}`;
  return { status, responseCode, authCode: status === "approved" ? "LOCAL123" : undefined, transId, avsResultCode: "Y", cvvResultCode: "M", messages: [message], safeRawResponse: { responseCode, transId, message, amountCents: request.amountCents }, ...extras };
}
export const authorizeNetEmulator = { async charge(request: AuthorizeNetChargeRequest): Promise<AuthorizeNetChargeResponse> {
  const token = readToken(request.opaqueData.dataValue);
  if (!token?.cardNumber || !token.expMonth || !token.expYear) return response(request, "error", "Payment token could not be read.");
  if (!luhn(token.cardNumber)) return response(request, "declined", "Invalid card number.");
  if (expired(token.expMonth, token.expYear)) return response(request, "declined", "Expired card.");
  if (!approvedCards.has(token.cardNumber)) return response(request, "declined", "Unknown card number.");
  if (token.cvv === "901") return response(request, "declined", "CVV mismatch.", { cvvResultCode: "N" });
  if ((token.billingPostalCode || request.billingAddress.postalCode || request.shippingAddress.postalCode).trim() === "46282") return response(request, "declined", "ZIP code declined.", { avsResultCode: "N" });
  return response(request, "approved", "This transaction has been approved.");
} };
