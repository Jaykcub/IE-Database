import { Buffer } from "node:buffer";

/** Decoded file size limit (per document). */
export const MAX_JOB_DOCUMENT_BYTES = 512 * 1024;

/** Max documents stored per job (API-enforced). */
export const MAX_JOB_DOCUMENTS_PER_JOB = 15;

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/**
 * @param {string} input - raw base64 or data URL
 * @returns {{ mimeType: string, buffer: Buffer }}
 */
export function decodeBase64Upload(input) {
  const raw = String(input ?? "").trim();
  if (!raw) throw new Error("Empty file payload");

  let mimeType = "application/octet-stream";
  let b64 = raw.replace(/\s/g, "");

  const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(raw);
  if (dataUrl) {
    mimeType = dataUrl[1].trim().toLowerCase();
    b64 = dataUrl[2].replace(/\s/g, "");
  }

  let buffer;
  try {
    buffer = Buffer.from(b64, "base64");
  } catch {
    throw new Error("Invalid base64 encoding");
  }

  if (!buffer.length) throw new Error("Decoded file is empty");
  if (buffer.length > MAX_JOB_DOCUMENT_BYTES) {
    throw new Error(
      `File exceeds ${MAX_JOB_DOCUMENT_BYTES / 1024} KB limit after decoding.`,
    );
  }

  if (!ALLOWED_MIMES.has(mimeType)) {
    throw new Error(
      `Unsupported file type (${mimeType}). Allowed: PDF, images, plain text, CSV, Word.`,
    );
  }

  return { mimeType, buffer };
}

export function sanitizeFileName(name) {
  const base = String(name ?? "upload").replace(/[/\\?%*:|"<>]/g, "_").trim();
  return base.slice(0, 180) || "upload";
}

export function bufferToStoredBase64(buffer) {
  return buffer.toString("base64");
}
