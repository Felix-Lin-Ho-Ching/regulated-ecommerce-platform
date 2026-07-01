import { TaxJarClient } from "@/lib/tax/taxjar-client";
import type { CalculateTaxInput, TaxAddress, TaxCalculationResult, TaxMode, TaxProvider } from "@/lib/tax/types";

export class TaxCalculationError extends Error {
  constructor(message = "Tax calculation is unavailable. Please try again before payment.") {
    super(message);
    this.name = "TaxCalculationError";
  }
}

export function getTaxMode(mode = process.env.TAX_MODE || "disabled"): TaxMode {
  const normalized = mode.trim().toLowerCase();
  if (normalized === "taxjar_sandbox" || normalized === "taxjar_live") return normalized;
  return "disabled";
}

export function getTaxJarApiUrl(mode: TaxMode) {
  if (process.env.TAXJAR_API_URL) return process.env.TAXJAR_API_URL;
  return mode === "taxjar_live" ? "https://api.taxjar.com/v2" : "https://api.sandbox.taxjar.com/v2";
}

export function getShipFromAddress(): TaxAddress {
  return {
    line1: process.env.TAX_SHIP_FROM_LINE1 || process.env.SHIP_FROM_LINE1 || "410 Congress Ave",
    line2: process.env.TAX_SHIP_FROM_LINE2 || process.env.SHIP_FROM_LINE2 || undefined,
    city: process.env.TAX_SHIP_FROM_CITY || process.env.SHIP_FROM_CITY || "Austin",
    state: (process.env.TAX_SHIP_FROM_STATE || process.env.SHIP_FROM_STATE || "TX").toUpperCase(),
    postalCode: process.env.TAX_SHIP_FROM_POSTAL_CODE || process.env.SHIP_FROM_POSTAL_CODE || "78701",
    country: process.env.TAX_SHIP_FROM_COUNTRY || process.env.SHIP_FROM_COUNTRY || "US",
  };
}

export function createTaxProvider(mode = getTaxMode()): TaxProvider | null {
  if (mode === "disabled") return null;
  const apiKey = process.env.TAXJAR_API_KEY;
  if (!apiKey) throw new TaxCalculationError("Tax provider is not configured. TAXJAR_API_KEY is required.");
  return new TaxJarClient({ apiKey, apiUrl: getTaxJarApiUrl(mode) });
}

export async function calculateCheckoutTax(input: Omit<CalculateTaxInput, "fromAddress">, provider = createTaxProvider()): Promise<TaxCalculationResult> {
  if (!provider) return { taxCents: 0, provider: "disabled", snapshot: { mode: "disabled" } };
  try {
    return await provider.calculateTax({ ...input, fromAddress: getShipFromAddress() });
  } catch (error) {
    if (error instanceof TaxCalculationError) throw error;
    throw new TaxCalculationError(error instanceof Error ? error.message : undefined);
  }
}
