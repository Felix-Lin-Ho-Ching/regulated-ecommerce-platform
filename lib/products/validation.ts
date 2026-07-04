import { detectMediaKindFromUpload, isUploadFile } from "@/lib/media/upload-detection";

export const productStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const restrictedClassOptions = ["STUN_GUN"] as const;
export const productMediaTypes = ["IMAGE", "YOUTUBE"] as const;
export const maxProductImageRows = 8;
export const maxProductYoutubeRows = 2;
export const maxProductMediaRows = 10;
export const maxProductContentRows = 10;
export const maxProductIncludedRows = 12;
export const maxProductSpecRows = 30;
export const maxProductFAQRows = 20;
export const maxProductFeatureRows = 12;
export const productSectionKeys = ["overview", "features_design", "comparison", "custom_section", "state_requirements"] as const;
export const normalProductSectionKeys = ["features_design", "comparison", "custom_section"] as const;

type ProductStatus = (typeof productStatuses)[number];
export type RestrictedClass = (typeof restrictedClassOptions)[number];
export type ProductMediaType = (typeof productMediaTypes)[number];
export type ProductSectionKey = (typeof productSectionKeys)[number];

export type ProductFeatureInput = {
  code: string;
  label: string;
  value: string;
  restrictedRelevant: boolean;
};

export type ProductMediaInput = {
  type: ProductMediaType;
  url: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  alt?: string;
  title?: string;
  sortOrder: number;
};

export type ProductContentSectionInput = { sectionKey: ProductSectionKey; eyebrow?: string; title: string; body?: string; imageUrl?: string; videoUrl?: string; ctaLabel?: string; ctaHref?: string; sortOrder: number };
export type ProductIncludedItemInput = { label: string; description?: string; quantity: number; sortOrder: number };
export type ProductSpecInput = { label: string; value: string; group?: string; sortOrder: number };
export type ProductFAQInput = { question: string; answer: string; sortOrder: number };

export type ProductFormInput = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  categoryId?: string;
  restrictedClass?: RestrictedClass;
  description: string;
  status: ProductStatus;
  restricted: boolean;
  sku: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  features: ProductFeatureInput[];
  media: ProductMediaInput[];
  contentSections: ProductContentSectionInput[];
  includedItems: ProductIncludedItemInput[];
  specs: ProductSpecInput[];
  faqs: ProductFAQInput[];
  featuresSubmitted?: boolean;
  mediaSubmitted?: boolean;
  contentSubmitted?: boolean;
  includedSubmitted?: boolean;
  specsSubmitted?: boolean;
  faqsSubmitted?: boolean;
  auditNote: string;
};

export class ProductFormValidationError extends Error {}


function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(value: string, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function centsFromDollars(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function intOrDefault(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractYouTubeVideoId(value: string): string | undefined {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const normalizedHost = host.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (normalizedHost === "youtu.be") return parts[0];
    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(normalizedHost)) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || undefined;
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1];
    }
    if (normalizedHost === "youtube-nocookie.com" && parts[0] === "embed") return parts[1];
  } catch {
    return undefined;
  }
  return undefined;
}

function isValidYouTubeVideoId(value: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

function isValidMediaUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type MediaUploadResolver = (file: File, type: ProductMediaType, role: "media" | "thumbnail") => Promise<string>;

async function parseMediaRows(formData: FormData, resolveUpload?: MediaUploadResolver): Promise<ProductMediaInput[]> {
  const rows: ProductMediaInput[] = [];

  for (let index = 0; index < maxProductMediaRows; index += 1) {
    let type = oneOf(text(formData, `mediaType${index}`), productMediaTypes, "IMAGE");
    const url = text(formData, `mediaUrl${index}`);
    const thumbnailUrl = text(formData, `mediaThumbnailUrl${index}`);
    const youtubeUrl = text(formData, `mediaYoutubeUrl${index}`);
    const alt = text(formData, `mediaAlt${index}`);
    const title = text(formData, `mediaTitle${index}`);
    const sortOrderValue = text(formData, `mediaSortOrder${index}`);
    const uploadFile = formData.get(`mediaUpload${index}`);
    const thumbnailUploadFile = formData.get(`mediaThumbnailUpload${index}`);
    const hasUpload = isUploadFile(uploadFile);
    const hasThumbnailUpload = isUploadFile(thumbnailUploadFile);
    const detectedMediaType = detectMediaKindFromUpload(uploadFile);
    const hasVisibleInput = Boolean(url || youtubeUrl || thumbnailUrl || alt || title || sortOrderValue || hasUpload || hasThumbnailUpload);

    if (!hasVisibleInput) continue;
    if (hasUpload && !detectedMediaType) throw new ProductFormValidationError(`Media row ${index + 1}: Unsupported media file. Upload a JPEG, PNG, or WebP image.`);
    if (detectedMediaType) type = "IMAGE";
    const youtubeUrlFromMediaUrl = url ? extractYouTubeVideoId(url) : undefined;
    const youtubeSourceUrl = youtubeUrl || (youtubeUrlFromMediaUrl ? url : "");
    const youtubeVideoId = youtubeSourceUrl ? extractYouTubeVideoId(youtubeSourceUrl) : undefined;
    if (youtubeUrl || youtubeUrlFromMediaUrl) type = "YOUTUBE";
    if ((youtubeUrl || type === "YOUTUBE") && (!youtubeVideoId || !isValidYouTubeVideoId(youtubeVideoId))) throw new ProductFormValidationError(`Media row ${index + 1}: enter a valid YouTube URL.`);
    if (!url && !youtubeUrl && !hasUpload) throw new ProductFormValidationError(`Media row ${index + 1}: Media URL, YouTube URL, or uploaded image is required when media details are provided.`);
    if (url && !isValidMediaUrl(url)) throw new ProductFormValidationError(`Media row ${index + 1}: enter a valid http(s) or local URL.`);
    if (thumbnailUrl && !isValidMediaUrl(thumbnailUrl)) throw new ProductFormValidationError(`Media row ${index + 1}: enter a valid thumbnail URL.`);

    let finalUrl = url;
    let finalThumbnailUrl = thumbnailUrl;
    try {
      if (hasUpload) {
        if (!resolveUpload) throw new ProductFormValidationError("Upload handling is unavailable.");
        finalUrl = await resolveUpload(uploadFile, type, "media");
      }
      if (hasThumbnailUpload) {
        if (!resolveUpload) throw new ProductFormValidationError("Upload handling is unavailable.");
        finalThumbnailUrl = await resolveUpload(thumbnailUploadFile, "IMAGE", "thumbnail");
      }
    } catch (error) {
      if (error instanceof ProductFormValidationError) throw error;
      const message = error instanceof Error ? error.message : "Upload failed. Try again or use a media URL.";
      throw new ProductFormValidationError(`Media row ${index + 1}: ${message}`);
    }

    rows.push({
      type,
      url: type === "YOUTUBE" ? youtubeSourceUrl : finalUrl,
      thumbnailUrl: finalThumbnailUrl || undefined,
      youtubeVideoId,
      alt: alt || undefined,
      title: title || undefined,
      sortOrder: rows.length,
    });
  }

  const imageCount = rows.filter((row) => row.type === "IMAGE").length;
  const youtubeCount = rows.filter((row) => row.type === "YOUTUBE").length;
  if (imageCount > maxProductImageRows) throw new ProductFormValidationError(`Product media limit reached: use at most ${maxProductImageRows} images.`);
  if (youtubeCount > maxProductYoutubeRows) throw new ProductFormValidationError(`Product media limit reached: use at most ${maxProductYoutubeRows} YouTube videos.`);
  if (rows.length > maxProductMediaRows) throw new ProductFormValidationError(`Product media limit reached: use at most ${maxProductMediaRows} total media items.`);

  return rows;
}

function parseContentSections(formData: FormData): ProductContentSectionInput[] {
  return Array.from({ length: maxProductContentRows }, (_, index) => ({
    sectionKey: oneOf(text(formData, `sectionKey${index}`), productSectionKeys, "overview"),
    eyebrow: text(formData, `sectionEyebrow${index}`) || undefined,
    title: text(formData, `sectionTitle${index}`),
    body: text(formData, `sectionBody${index}`) || undefined,
    imageUrl: text(formData, `sectionImageUrl${index}`) || undefined,
    videoUrl: text(formData, `sectionVideoUrl${index}`) || undefined,
    ctaLabel: text(formData, `sectionCtaLabel${index}`) || undefined,
    ctaHref: text(formData, `sectionCtaHref${index}`) || undefined,
    sortOrder: index,
  })).filter((section) => section.title && (!["overview", "state_requirements"].includes(section.sectionKey) || Boolean(section.body)));
}

function parseIncludedItems(formData: FormData): ProductIncludedItemInput[] {
  return Array.from({ length: maxProductIncludedRows }, (_, index) => ({ label: text(formData, `includedLabel${index}`), description: text(formData, `includedDescription${index}`) || undefined, quantity: intOrDefault(text(formData, `includedQuantity${index}`), 1), sortOrder: index })).filter((item) => item.label);
}

function parseSpecs(formData: FormData): ProductSpecInput[] {
  return Array.from({ length: maxProductSpecRows }, (_, index) => ({ label: text(formData, `specLabel${index}`), value: text(formData, `specValue${index}`), group: text(formData, `specGroup${index}`) || undefined, sortOrder: index })).filter((spec) => spec.label && spec.value);
}

function parseFaqs(formData: FormData): ProductFAQInput[] {
  return Array.from({ length: maxProductFAQRows }, (_, index) => ({ question: text(formData, `faqQuestion${index}`), answer: text(formData, `faqAnswer${index}`), sortOrder: index })).filter((faq) => faq.question && faq.answer);
}

export async function parseProductForm(formData: FormData, resolveUpload?: MediaUploadResolver): Promise<ProductFormInput> {
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const sku = text(formData, "sku");
  const categoryId = text(formData, "categoryId") || undefined;
  const priceCents = centsFromDollars(text(formData, "price"));
  const restricted = formData.get("restricted") === "on";
  const restrictedClass = restricted ? oneOf(text(formData, "restrictedClass"), restrictedClassOptions, "STUN_GUN") : undefined;
  const intent = text(formData, "intent");
  const status = intent === "draft" ? "DRAFT" : intent === "publish" ? "ACTIVE" : intent === "archive" ? "ARCHIVED" : oneOf(text(formData, "status"), productStatuses, "DRAFT");

  const missing: string[] = [];
  if (!name) missing.push("missing name");
  if (!slug) missing.push("missing slug");
  if (!sku) missing.push("missing SKU");
  if (priceCents <= 0) missing.push("missing price");
  if (!categoryId) missing.push("missing category");
  if (restricted && !restrictedClass) missing.push("missing compliance class for restricted product");
  if (status === "ACTIVE" && missing.length) throw new ProductFormValidationError(`Cannot publish product: ${missing.join(", ")}.`);
  if (missing.length) throw new ProductFormValidationError(`Product details need fixes: ${missing.join(", ")}.`);

  return {
    id: text(formData, "id") || undefined,
    name,
    slug,
    brand: text(formData, "brand") || "Stun Fry",
    categoryId,
    restrictedClass,
    description: text(formData, "description") || "Owner-managed product description pending.",
    status,
    restricted,
    sku,
    priceCents,
    stockQuantity: Math.max(0, intOrDefault(text(formData, "stockQuantity"), 0)),
    lowStockThreshold: Math.max(0, intOrDefault(text(formData, "lowStockThreshold"), 0)),
    features: Array.from({ length: maxProductFeatureRows }, (_, index) => ({
        code: text(formData, `featureCode${index}`),
        label: text(formData, `featureLabel${index}`),
        value: text(formData, `featureValue${index}`),
        restrictedRelevant: formData.get(`featureRestricted${index}`) === "on",
      }))
      .filter((feature) => feature.code || feature.label || feature.value)
      .filter((feature) => feature.code && feature.label),
    media: await parseMediaRows(formData, resolveUpload),
    contentSections: parseContentSections(formData),
    includedItems: parseIncludedItems(formData),
    specs: parseSpecs(formData),
    faqs: parseFaqs(formData),
    featuresSubmitted: formData.has("featuresSubmitted"),
    mediaSubmitted: formData.has("mediaSubmitted"),
    contentSubmitted: formData.has("contentSubmitted"),
    includedSubmitted: formData.has("includedSubmitted"),
    specsSubmitted: formData.has("specsSubmitted"),
    faqsSubmitted: formData.has("faqsSubmitted"),
    auditNote: text(formData, "auditNote"),
  };
}
