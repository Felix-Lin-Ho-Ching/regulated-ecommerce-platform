export function clientSlugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function skuPart(value: string, fallback: string): string {
  const words = value.toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return ((words.length > 1 ? words.map((word) => word[0]).join("") : words[0]) || fallback).slice(0, 4);
}
export function localSku(brand: string, category: string, name: string): string {
  const short = clientSlugify(name).split("-").filter(Boolean).slice(0, 2).join("").toUpperCase().slice(0, 10) || "ITEM";
  return `${skuPart(brand, "SF")}-${skuPart(category, "CAT")}-${short}-${Math.floor(1000 + Math.random() * 9000)}`;
}
