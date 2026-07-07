export const trackingPlaceholder = "{{trackingNumber}}";

export type ShippingCarrierOption = { id: string; name: string; code: string; trackingUrlTemplate: string; enabled: boolean; sortOrder: number };

export function normalizeCarrierCode(code: string) {
  return code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function validateTrackingUrlTemplate(template: string) {
  const value = template.trim();
  if (!value.includes(trackingPlaceholder)) return "Tracking URL template must include {{trackingNumber}}.";
  let url: URL;
  try { url = new URL(value.replaceAll(trackingPlaceholder, "TEST123")); } catch { return "Tracking URL template must be a valid URL."; }
  if (url.protocol === "javascript:") return "Tracking URL template cannot use javascript:.";
  if (url.protocol !== "https:") return "Tracking URL template must start with https://.";
  return null;
}

export function renderTrackingUrl(template: string, trackingNumber: string) {
  return template.replaceAll(trackingPlaceholder, encodeURIComponent(trackingNumber.trim()));
}
