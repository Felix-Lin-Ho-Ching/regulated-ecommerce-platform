import { prisma } from "@/lib/db/prisma";

import { normalizeCarrierCode, renderTrackingUrl, type ShippingCarrierOption } from "@/lib/shipping/tracking";

export { normalizeCarrierCode, renderTrackingUrl, validateTrackingUrlTemplate, trackingPlaceholder, type ShippingCarrierOption } from "@/lib/shipping/tracking";

export const defaultShippingCarriers = [
  { name: "UPS", code: "ups", trackingUrlTemplate: "https://www.ups.com/track?tracknum={{trackingNumber}}", sortOrder: 10 },
  { name: "USPS", code: "usps", trackingUrlTemplate: "https://tools.usps.com/go/TrackConfirmAction?tLabels={{trackingNumber}}", sortOrder: 20 },
  { name: "FedEx", code: "fedex", trackingUrlTemplate: "https://www.fedex.com/fedextrack/?trknbr={{trackingNumber}}", sortOrder: 30 },
  { name: "DHL", code: "dhl", trackingUrlTemplate: "https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id={{trackingNumber}}", sortOrder: 40 },
  { name: "OnTrac", code: "ontrac", trackingUrlTemplate: "https://www.ontrac.com/tracking/?number={{trackingNumber}}", sortOrder: 50 },
] as const;

export async function seedDefaultShippingCarriers(client: any = prisma) {
  for (const carrier of defaultShippingCarriers) {
    await client.shippingCarrier.upsert({ where: { code: carrier.code }, update: {}, create: carrier });
  }
}

export async function getEnabledShippingCarriers(): Promise<ShippingCarrierOption[]> {
  return (prisma as any).shippingCarrier.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function buildTrackingUrlFromCarrier(carrierCodeOrName?: string | null, trackingNumber?: string | null): Promise<string | null> {
  const carrier = (carrierCodeOrName || "").trim();
  const number = (trackingNumber || "").trim();
  if (!carrier || !number) return null;
  const code = normalizeCarrierCode(carrier);
  try {
    const found = await (prisma as any).shippingCarrier.findFirst({
      where: { enabled: true, OR: [{ code }, { name: { equals: carrier, mode: "insensitive" } }] },
    });
    if (!found?.trackingUrlTemplate) return null;
    return renderTrackingUrl(found.trackingUrlTemplate, number);
  } catch {
    const legacy = defaultShippingCarriers.find((c) => [c.code, c.name.toLowerCase()].includes(carrier.toLowerCase()) || carrier.toLowerCase().includes(c.code));
    return legacy && ["ups", "usps", "fedex"].includes(legacy.code) ? renderTrackingUrl(legacy.trackingUrlTemplate, number) : null;
  }
}
