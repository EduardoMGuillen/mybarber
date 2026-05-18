import { del, put } from "@vercel/blob";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN no está configurado. Crea un Blob store en Vercel y añade el token.",
    );
  }
}

export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Solo se permiten imágenes JPG, PNG, WebP o GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 2 MB.");
  }
}

export async function uploadPublicImage(file: File, pathname: string) {
  assertBlobConfigured();
  validateImageFile(file);
  const blob = await put(pathname, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deleteBlobByUrl(url: string) {
  if (!url || !url.includes("blob.vercel-storage.com")) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // ignore stale blob errors
  }
}
