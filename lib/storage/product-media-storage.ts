import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const PRODUCT_IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PRODUCT_VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm"] as const;
export const PRODUCT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PRODUCT_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const extensionsByMimeType: Record<string, string[]> = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "video/mp4": [".mp4"], "video/webm": [".webm"] };
const canonicalExtension: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "video/mp4": ".mp4", "video/webm": ".webm" };
const fallbackTypes = new Set(["", "application/octet-stream"]);

export class ProductMediaStorageError extends Error {}

function safeBaseName(fileName: string) {
  return path.parse(fileName).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64) || "product-media";
}

export async function storeProductMediaFile(file: File, options: { allowedTypes: readonly string[]; maxBytes: number }) {
  if (!file || file.size <= 0) throw new ProductMediaStorageError("Choose a non-empty media file to upload.");
  if (file.size > options.maxBytes) throw new ProductMediaStorageError(`File is too large. Maximum size is ${Math.floor(options.maxBytes / 1024 / 1024)} MB.`);
  const mimeType = file.type.toLowerCase();
  const extension = path.extname(file.name).toLowerCase();
  const allowed = options.allowedTypes.includes(mimeType) ? mimeType : fallbackTypes.has(mimeType) ? options.allowedTypes.find((type) => extensionsByMimeType[type]?.includes(extension)) : undefined;
  if (!allowed) throw new ProductMediaStorageError("Unsupported file type. Upload JPG, JPEG, PNG, WebP, MP4, or WebM files only.");
  const uploadDir = path.join(process.cwd(), "public", "uploads", "product-media");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${safeBaseName(file.name)}-${randomBytes(8).toString("hex")}${canonicalExtension[allowed] ?? extension}`;
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
  return { publicPath: `/uploads/product-media/${fileName}`, fileName, mimeType: allowed, size: file.size };
}
