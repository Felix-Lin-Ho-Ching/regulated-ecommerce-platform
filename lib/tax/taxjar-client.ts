import type { CalculateTaxInput, TaxCalculationResult, TaxProvider } from "@/lib/tax/types";

function centsToDollars(cents: number) {
  return Math.max(0, cents) / 100;
}

function dollarsToCents(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

export class TaxJarClient implements TaxProvider {
  constructor(private readonly options: { apiKey: string; apiUrl: string }) {}

  async calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult> {
    const response = await fetch(`${this.options.apiUrl.replace(/\/$/, "")}/taxes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_country: input.fromAddress.country ?? "US",
        from_zip: input.fromAddress.postalCode,
        from_state: input.fromAddress.state,
        from_city: input.fromAddress.city,
        from_street: input.fromAddress.line1,
        to_country: input.toAddress.country ?? "US",
        to_zip: input.toAddress.postalCode,
        to_state: input.toAddress.state,
        to_city: input.toAddress.city,
        to_street: input.toAddress.line1,
        amount: centsToDollars(input.lineItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity - (item.discountCents ?? 0), 0)),
        shipping: centsToDollars(input.shippingCents),
        line_items: input.lineItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product_identifier: item.sku ?? item.productId ?? item.id,
          description: item.name,
          unit_price: centsToDollars(item.unitPriceCents),
          discount: centsToDollars(item.discountCents ?? 0),
          product_tax_code: item.productTaxCode ?? item.categoryTaxCode ?? undefined,
        })),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`TaxJar tax calculation failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const payload = await response.json();
    const tax = payload?.tax ?? payload;
    return {
      taxCents: dollarsToCents(tax?.amount_to_collect),
      provider: "taxjar",
      calculationId: tax?.transaction_id ?? tax?.jurisdictions?.taxable_address_id ?? input.orderReference,
      snapshot: tax,
    };
  }
}
