export type AuthorizeNetMockStatus = "APPROVED" | "DECLINED" | "MANUAL_REVIEW";

export type AuthorizeNetMockRequest = { orderNumber: string; amountCents: number };
export type MockCardInput = { cardNumber?: string; expiration?: string; cvv?: string; nameOnCard?: string; postalCode?: string };

export type AuthorizeNetMockResponse = {
  provider: "AUTHORIZE_NET_MOCK";
  providerStatus: "DEVELOPMENT_APPROVED" | "MANUAL_REVIEW";
  status: AuthorizeNetMockStatus;
  responseCode: "1" | "2" | "4";
  authCode?: string;
  transId: string;
  amountCents: number;
  avsResultCode: string;
  cvvResultCode: string;
  accountType: string;
  accountNumber: string;
  message?: string;
};

const approvedCards = new Set(["4111111111111111", "4007000000027", "5424000000000015", "370000000000002", "6011000000000012"]);

function digits(value = "") { return value.replace(/\D/g, ""); }
function brand(number: string) { if (number.startsWith("4")) return "Visa"; if (number.startsWith("5")) return "Mastercard"; if (number.startsWith("37")) return "American Express"; if (number.startsWith("6")) return "Discover"; return "Card"; }
function luhn(number: string) { let sum = 0; let doubleIt = false; for (let i = number.length - 1; i >= 0; i--) { let n = Number(number[i]); if (doubleIt) { n *= 2; if (n > 9) n -= 9; } sum += n; doubleIt = !doubleIt; } return number.length >= 12 && sum % 10 === 0; }
function expired(expiration = "") { const match = expiration.match(/^(\d{2})\/(\d{2})$/); if (!match) return true; const month = Number(match[1]); const year = 2000 + Number(match[2]); if (month < 1 || month > 12) return true; const end = new Date(year, month, 0, 23, 59, 59, 999); return end < new Date(); }

export function createMockCardTransaction(request: AuthorizeNetMockRequest, card: MockCardInput = {}): AuthorizeNetMockResponse {
  const cardNumber = digits(card.cardNumber);
  const base = { provider: "AUTHORIZE_NET_MOCK" as const, transId: `MOCK-CARD-${request.orderNumber}-${Date.now()}`, amountCents: request.amountCents, avsResultCode: "Y", cvvResultCode: "M", accountType: brand(cardNumber), accountNumber: cardNumber ? `XXXX${cardNumber.slice(-4)}` : "XXXX" };
  const decline = (message: string, cvvResultCode = "M") => ({ ...base, providerStatus: "DEVELOPMENT_APPROVED" as const, status: "DECLINED" as const, responseCode: "2" as const, cvvResultCode, message });
  if (!cardNumber || !card.expiration || !card.cvv || !card.nameOnCard?.trim()) return decline("Card number, expiration, security code, and name on card are required.");
  if (!luhn(cardNumber)) return decline("Invalid card number.");
  if (expired(card.expiration)) return decline("Expired card.");
  if (!approvedCards.has(cardNumber)) return decline("Unknown mock card number.");
  if (card.cvv.trim() === "901") return decline("CVV mismatch.", "N");
  if (card.postalCode?.trim() === "46282") return { ...decline("ZIP code declined."), avsResultCode: "N" };
  return { ...base, providerStatus: "DEVELOPMENT_APPROVED", status: "APPROVED", responseCode: "1", authCode: "MOCK123" };
}

export function createMockAuthorizeNetTransaction(request: AuthorizeNetMockRequest, mode: "mock_approved" | "mock_declined" | "mock_review"): AuthorizeNetMockResponse {
  const base = { provider: "AUTHORIZE_NET_MOCK" as const, transId: `MOCK-TXN-${request.orderNumber}`, amountCents: request.amountCents, avsResultCode: "Y", cvvResultCode: "M", accountType: "Visa", accountNumber: "XXXX1111" };
  if (mode === "mock_declined") return { ...base, providerStatus: "DEVELOPMENT_APPROVED", status: "DECLINED", responseCode: "2" };
  if (mode === "mock_review") return { ...base, providerStatus: "MANUAL_REVIEW", status: "MANUAL_REVIEW", responseCode: "4" };
  return { ...base, providerStatus: "DEVELOPMENT_APPROVED", status: "APPROVED", responseCode: "1", authCode: "MOCK123" };
}
