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

function safeBaseName(fileName: string): string {
  const parsed = path.parse(fileName).name.toLowerCase();
  const safe = parsed.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
  return safe || "media";
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
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
  if (!file || file.size === 0) throw new LocalMediaUploadError("Choose a non-empty media file to upload.");
  if (!options.allowedTypes.includes(file.type)) throw new LocalMediaUploadError("Unsupported file type. Upload a JPEG, PNG, WebP, MP4, WebM, or MOV file.");
  if (file.size > options.maxBytes) throw new LocalMediaUploadError(`File is too large. Maximum size is ${Math.floor(options.maxBytes / 1024 / 1024)} MB.`);

  const uploadDir = path.join(process.cwd(), "public", "uploads", options.folder);
  await mkdir(uploadDir, { recursive: true });

  const extension = extensionByMimeType[file.type] ?? path.extname(file.name).toLowerCase();
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
