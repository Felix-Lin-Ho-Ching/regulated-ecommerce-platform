import { evaluateCompliance } from "@/lib/compliance/compliance-service";

export type CheckoutReadiness = { canCollectPayment: boolean; canFulfill: boolean; reasons: string[] };

export async function getCheckoutReadiness(productCategory: string, stateCode: string): Promise<CheckoutReadiness> {
  const decision = await evaluateCompliance({ productCategory, stateCode });
  return { canCollectPayment: false, canFulfill: false, reasons: ["Live checkout and fulfillment are disabled in Phase 1.", ...decision.reasons] };
}
