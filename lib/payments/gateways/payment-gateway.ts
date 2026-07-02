import type { AuthorizeNetChargeRequest, AuthorizeNetChargeResponse } from "@/lib/payments/gateways/authorize-net-types";
import { authorizeNetEmulator } from "@/lib/payments/gateways/authorize-net-emulator";
export type PaymentGateway = { charge(request: AuthorizeNetChargeRequest): Promise<AuthorizeNetChargeResponse> };
export const paymentGateway: PaymentGateway = authorizeNetEmulator;
