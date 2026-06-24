import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_MEDIA_TYPES, VIDEO_MEDIA_TYPES, isUploadFile } from "@/lib/media/upload-detection";
export { IMAGE_MEDIA_TYPES, VIDEO_MEDIA_TYPES, detectMediaKindFromUpload, isUploadFile, type LocalMediaKind } from "@/lib/media/upload-detection";

// Local upload storage is for development/testing. Production should use S3/R2/Cloudinary or another durable object store.
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

export class LocalMediaUploadError extends Error {}

type LocalUploadFolder = "homepage" | "products";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const extensionsByMimeType: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
};

const fallbackMimeTypes = new Set(["", "application/octet-stream"]);

function safeBaseName(fileName: string): string {
  const parsed = path.parse(fileName).name.toLowerCase();
  const safe = parsed.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
  return safe || "media";
}

function allowedExtensions(allowedTypes: string[]): string[] {
  return allowedTypes.flatMap((type) => [...(extensionsByMimeType[type] ?? [])]);
}

function unsupportedFileMessage(allowedTypes: string[]): string {
  const allowsImages = IMAGE_MEDIA_TYPES.some((type) => allowedTypes.includes(type));
  const allowsVideos = VIDEO_MEDIA_TYPES.some((type) => allowedTypes.includes(type));
  if (allowsImages && !allowsVideos) return "Unsupported image file. Upload a JPEG, PNG, or WebP file.";
  if (allowsVideos && !allowsImages) return "Unsupported video file. Upload an MP4, WebM, or MOV file.";
  return "Unsupported media file. Upload a JPEG, PNG, WebP, MP4, WebM, or MOV file.";
}

function resolveUploadExtension(file: File, allowedTypes: string[]): string {
  const fileType = file.type.toLowerCase();
  const extension = path.extname(file.name).toLowerCase();
  const safeExtensions = allowedExtensions(allowedTypes);

  if (allowedTypes.includes(fileType) && safeExtensions.includes(extension)) return extensionByMimeType[fileType] ?? extension;
  if (fallbackMimeTypes.has(fileType) && safeExtensions.includes(extension)) return extension;

  throw new LocalMediaUploadError(unsupportedFileMessage(allowedTypes));
}

export async function saveLocalMediaUpload(
  file: File,
  options: {
    folder: LocalUploadFolder;
    allowedTypes: string[];
    maxBytes: number;
  },
): Promise<{
  publicPath: string;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  if (!isUploadFile(file)) throw new LocalMediaUploadError("Choose a non-empty media file to upload.");
  const extension = resolveUploadExtension(file, options.allowedTypes);
  if (file.size > options.maxBytes) throw new LocalMediaUploadError(`File is too large. Maximum size is ${Math.floor(options.maxBytes / 1024 / 1024)} MB.`);

  const uploadDir = path.join(process.cwd(), "public", "uploads", options.folder);
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${safeBaseName(file.name)}-${randomBytes(6).toString("hex")}${extension}`;
  const destination = path.join(uploadDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(destination, bytes);

  return {
    publicPath: `/uploads/${options.folder}/${fileName}`,
    fileName,
    mimeType: file.type,
    size: file.size,
  };
}
