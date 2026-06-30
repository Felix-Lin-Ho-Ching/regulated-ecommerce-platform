export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm"] as const;

export type LocalMediaKind = "IMAGE" | "VIDEO";

const fallbackMimeTypes = new Set(["", "application/octet-stream"]);

const mediaKindByMimeType: Record<string, LocalMediaKind> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
};

const mediaKindByExtension: Record<string, LocalMediaKind> = {
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".png": "IMAGE",
  ".webp": "IMAGE",
  ".mp4": "VIDEO",
  ".webm": "VIDEO",
};

const allowedExtensionsByKind: Record<LocalMediaKind, readonly string[]> = {
  IMAGE: [".jpg", ".jpeg", ".png", ".webp"],
  VIDEO: [".mp4", ".webm"],
};

function uploadFileName(value: FormDataEntryValue | null): string {
  if (!value || typeof value === "string") return "";
  const maybeFile = value as { name?: unknown };
  return typeof maybeFile.name === "string" ? maybeFile.name : "";
}

function extensionFromFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0) return "";
  return fileName.slice(lastDotIndex).toLowerCase();
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value === "string") return false;
  const maybeFile = value as { size?: unknown; name?: unknown; arrayBuffer?: unknown };
  return typeof maybeFile.size === "number" && maybeFile.size > 0 && typeof maybeFile.name === "string" && maybeFile.name.length > 0 && typeof maybeFile.arrayBuffer === "function";
}

export function detectMediaKindFromUpload(file: FormDataEntryValue | null): LocalMediaKind | null {
  if (!isUploadFile(file)) return null;

  const fileType = file.type.toLowerCase();
  const extension = extensionFromFileName(uploadFileName(file));
  const kindFromMime = mediaKindByMimeType[fileType];

  if (kindFromMime) return allowedExtensionsByKind[kindFromMime].includes(extension) ? kindFromMime : null;
  if (fallbackMimeTypes.has(fileType)) return mediaKindByExtension[extension] ?? null;

  return null;
}
