"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-service";
import { upsertHomepageHeroMedia, type HomepageHeroMedia, type HomepageMediaType } from "@/lib/storefront/homepage-media";
import { IMAGE_MEDIA_TYPES, LocalMediaUploadError, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, detectMediaKindFromUpload, saveLocalMediaUpload, VIDEO_MEDIA_TYPES, isUploadFile } from "@/lib/media/local-upload";

export type HomepageMediaFormState = { ok: boolean; errors: Record<string, string> };

function text(formData: FormData, key: string): string { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; }
function isSafeUrl(value: string): boolean { if (!value) return false; if (value.startsWith("/")) return !value.startsWith("//"); try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
function optionalUrl(value: string): boolean { return !value || isSafeUrl(value); }

export async function saveHomepageMediaAction(_prev: HomepageMediaFormState, formData: FormData): Promise<HomepageMediaFormState> {
  const enabled = formData.get("homepageEnabled") === "on";
  const typeValue = text(formData, "homepageType");
  const selectedType: HomepageMediaType = typeValue === "VIDEO" ? "VIDEO" : "IMAGE";
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

  if (enabled && !url && !isUploadFile(mediaFile)) errors.homepageUrl = "Media URL or uploaded media file is required when homepage media is enabled.";
  if (enabled && url && !isSafeUrl(url)) errors.homepageUrl = "Enter a valid URL beginning with https://, http://, or /.";
  if (!optionalUrl(thumbnailUrl)) errors.homepageThumbnailUrl = "Enter a valid fallback image URL or leave it blank.";
  if (!isSafeUrl(ctaHref)) errors.homepageCtaHref = "Enter a valid CTA link beginning with https://, http://, or /.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (isUploadFile(mediaFile)) {
    try {
      const allowedTypes = type === "VIDEO" ? [...VIDEO_MEDIA_TYPES] : [...IMAGE_MEDIA_TYPES];
      const maxBytes = type === "VIDEO" ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
      const upload = await saveLocalMediaUpload(mediaFile, { folder: "homepage", allowedTypes, maxBytes });
      url = upload.publicPath;
    } catch (error) {
      const message = error instanceof LocalMediaUploadError ? error.message : "Upload failed. Try again or use a media URL.";
      return { ok: false, errors: { homepageUpload: message } };
    }
  }

  if (isUploadFile(thumbnailFile)) {
    try {
      const upload = await saveLocalMediaUpload(thumbnailFile, { folder: "homepage", allowedTypes: [...IMAGE_MEDIA_TYPES], maxBytes: MAX_IMAGE_UPLOAD_BYTES });
      thumbnailUrl = upload.publicPath;
    } catch (error) {
      const message = error instanceof LocalMediaUploadError ? error.message : "Fallback image upload failed. Try again or use an image URL.";
      return { ok: false, errors: { homepageThumbnailUpload: message } };
    }
  }

  const note = text(formData, "homepageAuditNote") || "Owner updated homepage media.";
  const media: HomepageHeroMedia = { id: "hero", slot: "hero", type, url, thumbnailUrl, alt: text(formData, "homepageAlt"), title: text(formData, "homepageTitle"), subtitle: text(formData, "homepageSubtitle"), ctaLabel: text(formData, "homepageCtaLabel"), ctaHref, enabled, sortOrder: 0 };
  await upsertHomepageHeroMedia(media);
  await createAuditLog({ action: "UPDATE", entityType: "HomepageMedia", entityId: "hero", note, metadata: { type, enabled } });
  revalidatePath("/"); revalidatePath("/admin/storefront");
  return { ok: true, errors: {} };
}
