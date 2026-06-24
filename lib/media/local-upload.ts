import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Local upload storage is for development/testing. Production should use S3/R2/Cloudinary or another durable object store.
export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
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

function uploadFileName(value: FormDataEntryValue | null): string {
  if (!value || typeof value === "string") return "";
  const maybeFile = value as { name?: unknown };
  return typeof maybeFile.name === "string" ? maybeFile.name : "";
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value === "string") return false;
  const maybeFile = value as { size?: unknown; name?: unknown; arrayBuffer?: unknown };
  return typeof maybeFile.size === "number" && maybeFile.size > 0 && typeof maybeFile.name === "string" && maybeFile.name.length > 0 && typeof maybeFile.arrayBuffer === "function";
}

function allowedExtensions(allowedTypes: string[]): string[] {
  return allowedTypes.flatMap((type) => [...(extensionsByMimeType[type] ?? [])]);
}

function resolveUploadExtension(file: File, allowedTypes: string[]): string {
  const fileType = file.type.toLowerCase();
  if (allowedTypes.includes(fileType)) return extensionByMimeType[fileType] ?? path.extname(file.name).toLowerCase();

  const extension = path.extname(uploadFileName(file)).toLowerCase();
  if (fallbackMimeTypes.has(fileType) && allowedExtensions(allowedTypes).includes(extension)) return extension;

  throw new LocalMediaUploadError("Unsupported file type. Upload a JPEG, PNG, WebP, MP4, WebM, or MOV file.");
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
