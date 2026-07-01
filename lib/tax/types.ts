export type TaxMode = "disabled" | "taxjar_sandbox" | "taxjar_live";

export type TaxAddress = {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type TaxLineItem = {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
  productTaxCode?: string | null;
  categoryTaxCode?: string | null;
};

export type CalculateTaxInput = {
  fromAddress: TaxAddress;
  toAddress: TaxAddress;
  lineItems: TaxLineItem[];
  shippingCents: number;
  discountCents?: number;
  orderReference?: string;
};

export type TaxCalculationResult = {
  taxCents: number;
  provider: string;
  calculationId?: string;
  snapshot?: unknown;
};

export interface TaxProvider {
  calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult>;
}
