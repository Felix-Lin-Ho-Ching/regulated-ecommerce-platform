import type { PaymentAddress, PaymentCardSummary, PaymentOpaqueData } from "@/lib/payments/gateways/authorize-net-types";

export type CreatePaymentOpaqueDataInput = { cardNumber: string; expirationMonth: string; expirationYear: string; cvv: string; nameOnCard: string; billingAddress: PaymentAddress };
export type CreatePaymentOpaqueDataResult = { opaqueData: PaymentOpaqueData; cardSummary: PaymentCardSummary };

function digits(value: string) { return value.replace(/\D/g, ""); }
function brand(number: string) { if (number.startsWith("4")) return "Visa"; if (number.startsWith("5")) return "Mastercard"; if (number.startsWith("37")) return "American Express"; if (number.startsWith("6")) return "Discover"; return "Card"; }

export async function createPaymentOpaqueData(input: CreatePaymentOpaqueDataInput): Promise<CreatePaymentOpaqueDataResult> {
  const cardNumber = digits(input.cardNumber);
  const expMonth = input.expirationMonth.padStart(2, "0");
  const expYear = input.expirationYear.length === 2 ? `20${input.expirationYear}` : input.expirationYear;
  const payload = { testOnly: true, cardNumber, cvv: input.cvv.trim(), expMonth, expYear, nameOnCard: input.nameOnCard.trim(), billingPostalCode: input.billingAddress.postalCode };
  return {
    opaqueData: { dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT", dataValue: `local-test-${btoa(JSON.stringify(payload))}` },
    cardSummary: { brand: brand(cardNumber), last4: cardNumber.slice(-4), expMonth, expYear },
  };
}
