"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import { deleteHomepageSlide, upsertHomepageSlide, type HomepageMediaType, type HomepageSlide } from "@/lib/storefront/homepage-slides";
import { IMAGE_MEDIA_TYPES, LocalMediaUploadError, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, detectMediaKindFromUpload, saveLocalMediaUpload, VIDEO_MEDIA_TYPES, isUploadFile } from "@/lib/media/local-upload";

export type HomepageMediaFormState = { ok: boolean; errors: Record<string, string> };

function text(formData: FormData, key: string): string { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; }
function int(formData: FormData, key: string): number { const parsed = Number.parseInt(text(formData, key), 10); return Number.isFinite(parsed) ? parsed : 0; }
function isSafeUrl(value: string): boolean { if (!value) return false; if (value.startsWith("/")) return !value.startsWith("//"); try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
function optionalUrl(value: string): boolean { return !value || isSafeUrl(value); }

export async function saveHomepageMediaAction(_prev: HomepageMediaFormState, formData: FormData): Promise<HomepageMediaFormState> {
  const intent = text(formData, "intent");
  const id = text(formData, "homepageId") || "new";
  if (intent === "delete") {
    await deleteHomepageSlide(id);
    await createAuditLog({ action: "UPDATE", entityType: "HomepageMedia", entityId: id, note: "Owner deleted homepage hero slide." });
    revalidatePath("/"); revalidatePath("/admin/storefront");
    return { ok: true, errors: {} };
  }

  const enabled = formData.get("homepageEnabled") === "on";
  const selectedType: HomepageMediaType = text(formData, "homepageType") === "VIDEO" ? "VIDEO" : "IMAGE";
  let type: HomepageMediaType = selectedType;
  let url = text(formData, "homepageUrl");
  let thumbnailUrl = text(formData, "homepageThumbnailUrl");
  const mediaFile = formData.get("homepageUpload");
  const thumbnailFile = formData.get("homepageThumbnailUpload");
  const ctaHref = text(formData, "homepageCtaHref") || "/products";
  const errors: Record<string, string> = {};
  const detectedMediaType = detectMediaKindFromUpload(mediaFile);

  if (isUploadFile(mediaFile) && !detectedMediaType) errors.homepageUpload = "Unsupported media file. Upload a JPEG, PNG, WebP, MP4, WebM, or MOV file.";
  if (detectedMediaType) type = detectedMediaType;
  if (!text(formData, "homepageHeadline")) errors.homepageHeadline = "Headline is required.";
  if (enabled && !url && !isUploadFile(mediaFile)) errors.homepageUrl = "Media URL or uploaded media file is required when this slide is enabled.";
  if (url && !isSafeUrl(url)) errors.homepageUrl = "Enter a valid URL beginning with https://, http://, or /.";
  if (!optionalUrl(thumbnailUrl)) errors.homepageThumbnailUrl = "Enter a valid fallback image URL or leave it blank.";
  if (!isSafeUrl(ctaHref)) errors.homepageCtaHref = "Enter a valid CTA link beginning with https://, http://, or /.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (isUploadFile(mediaFile)) {
    try {
      const allowedTypes = type === "VIDEO" ? [...VIDEO_MEDIA_TYPES] : [...IMAGE_MEDIA_TYPES];
      const maxBytes = type === "VIDEO" ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
      url = (await saveLocalMediaUpload(mediaFile, { folder: "homepage", allowedTypes, maxBytes })).publicPath;
    } catch (error) { return { ok: false, errors: { homepageUpload: error instanceof LocalMediaUploadError ? error.message : "Upload failed. Try again or use a media URL." } }; }
  }
  if (isUploadFile(thumbnailFile)) {
    try { thumbnailUrl = (await saveLocalMediaUpload(thumbnailFile, { folder: "homepage", allowedTypes: [...IMAGE_MEDIA_TYPES], maxBytes: MAX_IMAGE_UPLOAD_BYTES })).publicPath; }
    catch (error) { return { ok: false, errors: { homepageThumbnailUpload: error instanceof LocalMediaUploadError ? error.message : "Fallback image upload failed. Try again or use an image URL." } }; }
  }

  const slide: HomepageSlide = { id, slot: "hero-slide", type, url, thumbnailUrl, headline: text(formData, "homepageHeadline"), subheadline: text(formData, "homepageSubheadline"), ctaLabel: text(formData, "homepageCtaLabel") || "Shop devices", ctaHref, badge1: text(formData, "homepageBadge1"), badge2: text(formData, "homepageBadge2"), badge3: text(formData, "homepageBadge3"), enabled, sortOrder: int(formData, "homepageSortOrder") };
  const savedId = await upsertHomepageSlide(slide);
  await createAuditLog({ action: "UPDATE", entityType: "HomepageMedia", entityId: savedId, note: text(formData, "homepageAuditNote") || "Owner updated homepage hero slide.", metadata: { type, enabled, sortOrder: slide.sortOrder } });
  revalidatePath("/"); revalidatePath("/admin/storefront");
  return { ok: true, errors: {} };
}
