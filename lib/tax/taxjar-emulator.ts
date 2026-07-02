import type { CalculateTaxInput, TaxCalculationResult, TaxProvider } from "@/lib/tax/types";

const rates: Record<string, number> = { TX: 0.0825, CA: 0.0725, NY: 0.04, FL: 0.06 };

export class TaxJarEmulator implements TaxProvider {
  async calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult> {
    const taxableCents = input.lineItems.reduce((sum, item) => sum + Math.max(0, item.unitPriceCents * item.quantity - (item.discountCents ?? 0)), 0) + input.shippingCents - (input.discountCents ?? 0);
    const rate = rates[input.toAddress.state.toUpperCase()] ?? 0.06;
    return { taxCents: Math.max(0, Math.round(taxableCents * rate)), provider: "taxjar_emulator", calculationId: `taxjar-emulator-${input.orderReference ?? Date.now()}`, snapshot: { provider: "taxjar_emulator", rate, to: { state: input.toAddress.state, postalCode: input.toAddress.postalCode } } };
  }
}
