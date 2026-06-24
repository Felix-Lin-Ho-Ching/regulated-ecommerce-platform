"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog, requireAuditNote } from "@/lib/audit/audit-service";
import { upsertHomepageHeroMedia, type HomepageHeroMedia, type HomepageMediaType } from "@/lib/storefront/homepage-media";

export type HomepageMediaFormState = { ok: boolean; errors: Record<string, string> };

function text(formData: FormData, key: string): string { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; }
function isSafeUrl(value: string): boolean { if (!value) return false; if (value.startsWith("/")) return true; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
function optionalUrl(value: string): boolean { return !value || isSafeUrl(value); }

export async function saveHomepageMediaAction(_prev: HomepageMediaFormState, formData: FormData): Promise<HomepageMediaFormState> {
  const enabled = formData.get("homepageEnabled") === "on";
  const typeValue = text(formData, "homepageType");
  const type: HomepageMediaType = typeValue === "VIDEO" ? "VIDEO" : "IMAGE";
  const url = text(formData, "homepageUrl");
  const thumbnailUrl = text(formData, "homepageThumbnailUrl");
  const ctaHref = text(formData, "homepageCtaHref") || "/products";
  const errors: Record<string, string> = {};
  if (enabled && !url) errors.homepageUrl = "Media URL is required when homepage media is enabled.";
  if (enabled && url && !isSafeUrl(url)) errors.homepageUrl = "Enter a valid URL beginning with https://, http://, or /.";
  if (!optionalUrl(thumbnailUrl)) errors.homepageThumbnailUrl = "Enter a valid thumbnail URL or leave it blank.";
  if (!isSafeUrl(ctaHref)) errors.homepageCtaHref = "Enter a valid CTA link beginning with https://, http://, or /.";
  const noteValue = text(formData, "homepageAuditNote");
  let note = "";
  try { note = requireAuditNote(noteValue, "Homepage media update"); } catch (error) { errors.homepageAuditNote = error instanceof Error ? error.message : "Audit note is required."; }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const media: HomepageHeroMedia = { id: "hero", slot: "hero", type, url, thumbnailUrl, alt: text(formData, "homepageAlt"), title: text(formData, "homepageTitle"), subtitle: text(formData, "homepageSubtitle"), ctaLabel: text(formData, "homepageCtaLabel"), ctaHref, enabled, sortOrder: 0 };
  await upsertHomepageHeroMedia(media);
  await createAuditLog({ action: "UPDATE", entityType: "HomepageMedia", entityId: "hero", note, metadata: { type, enabled } });
  revalidatePath("/"); revalidatePath("/admin/storefront");
  return { ok: true, errors: {} };
}
