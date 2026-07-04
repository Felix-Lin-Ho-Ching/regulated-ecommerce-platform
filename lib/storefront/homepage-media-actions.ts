"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import { HERO_SLIDE_MAX, deleteHomepageSlide, getHomepageSlidesForAdmin, upsertHomepageSlide, type HomepageMediaType, type HomepageSlide } from "@/lib/storefront/homepage-slides";
import { IMAGE_MEDIA_TYPES, LocalMediaUploadError, MAX_IMAGE_UPLOAD_BYTES, detectMediaKindFromUpload, saveLocalMediaUpload, isUploadFile } from "@/lib/media/local-upload";
import { extractYouTubeVideoId } from "@/lib/products/validation";

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

  const slides = await getHomepageSlidesForAdmin();
  if (id === "new" && slides.length >= HERO_SLIDE_MAX) return { ok: false, errors: { homepageUrl: `Maximum reached: ${HERO_SLIDE_MAX} hero slides. Remove a slide before adding another.` } };

  const enabled = formData.get("homepageEnabled") === "on";
  const selectedType: HomepageMediaType = text(formData, "homepageType") === "YOUTUBE" ? "YOUTUBE" : "IMAGE";
  const type: HomepageMediaType = selectedType;
  let url = text(formData, "homepageUrl");
  let thumbnailUrl = text(formData, "homepageThumbnailUrl");
  const mediaFile = formData.get("homepageUpload");
  const thumbnailFile = formData.get("homepageThumbnailUpload");
  const ctaHref = text(formData, "homepageCtaHref") || "/products";
  const errors: Record<string, string> = {};
  const detectedMediaType = detectMediaKindFromUpload(mediaFile);
  const youtubeVideoId = type === "YOUTUBE" ? extractYouTubeVideoId(url) : undefined;

  if (isUploadFile(mediaFile) && (!detectedMediaType || detectedMediaType !== "IMAGE")) errors.homepageUpload = "Unsupported image file. Upload a JPEG, PNG, or WebP image.";
  if (type === "YOUTUBE" && isUploadFile(mediaFile)) errors.homepageUpload = "YouTube slides use a YouTube URL only. Video file uploads are not supported.";

  if (enabled && !url && !isUploadFile(mediaFile)) errors.homepageUrl = type === "YOUTUBE" ? "YouTube URL is required when this slide is enabled." : "Image URL or uploaded image file is required when this slide is enabled.";
  if (url && !isSafeUrl(url)) errors.homepageUrl = "Enter a valid URL beginning with https://, http://, or /.";
  if (type === "YOUTUBE" && url && !youtubeVideoId) errors.homepageUrl = "Enter a valid YouTube URL.";
  if (!optionalUrl(thumbnailUrl)) errors.homepageThumbnailUrl = "Enter a valid fallback image URL or leave it blank.";
  if (!isSafeUrl(ctaHref)) errors.homepageCtaHref = "Enter a valid CTA link beginning with https://, http://, or /.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (isUploadFile(mediaFile)) {
    try {
      url = (await saveLocalMediaUpload(mediaFile, { folder: "homepage", allowedTypes: [...IMAGE_MEDIA_TYPES], maxBytes: MAX_IMAGE_UPLOAD_BYTES })).publicPath;
    } catch (error) { return { ok: false, errors: { homepageUpload: error instanceof LocalMediaUploadError ? error.message : "Upload failed. Try again or use a media URL." } }; }
  }
  if (isUploadFile(thumbnailFile)) {
    try { thumbnailUrl = (await saveLocalMediaUpload(thumbnailFile, { folder: "homepage", allowedTypes: [...IMAGE_MEDIA_TYPES], maxBytes: MAX_IMAGE_UPLOAD_BYTES })).publicPath; }
    catch (error) { return { ok: false, errors: { homepageThumbnailUpload: error instanceof LocalMediaUploadError ? error.message : "Fallback image upload failed. Try again or use an image URL." } }; }
  }

  const slide: HomepageSlide = { id, slot: "hero-slide", type, url, thumbnailUrl, youtubeVideoId, headline: text(formData, "homepageHeadline") || "Homepage slide", subheadline: text(formData, "homepageSubheadline"), ctaLabel: text(formData, "homepageCtaLabel") || "Shop products", ctaHref, badge1: text(formData, "homepageBadge1"), badge2: text(formData, "homepageBadge2"), badge3: text(formData, "homepageBadge3"), enabled, sortOrder: Math.max(0, int(formData, "homepageSortOrder")) };
  const savedId = await upsertHomepageSlide(slide);
  await createAuditLog({ action: "UPDATE", entityType: "HomepageMedia", entityId: savedId, note: text(formData, "homepageAuditNote") || "Owner updated homepage hero slide.", metadata: { type, enabled, sortOrder: slide.sortOrder } });
  revalidatePath("/"); revalidatePath("/admin/storefront");
  return { ok: true, errors: {} };
}
