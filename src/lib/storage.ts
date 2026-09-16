import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Storage abstraction for uploaded media.
 *
 * The bundled adapter writes to `public/uploads`, which works locally and on any
 * server with a writable disk. Swapping in S3, R2 or Cloudinary means writing a
 * second adapter with this interface and selecting it in `getStorage()` —
 * nothing outside this file knows where bytes live.
 */
export type StoredFile = { url: string; name: string; size: number; type: string };

export interface StorageAdapter {
  put(input: { businessId: string; file: File }): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);
const MAX_BYTES = 6 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export class UploadError extends Error {}

const localAdapter: StorageAdapter = {
  async put({ businessId, file }) {
    if (!ALLOWED.has(file.type)) {
      throw new UploadError("That file type is not supported. Use JPG, PNG, WebP, GIF or SVG.");
    }
    if (file.size > MAX_BYTES) {
      throw new UploadError("Images must be 6MB or smaller.");
    }

    const ext = EXTENSIONS[file.type] ?? "bin";
    const name = `${crypto.randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", businessId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return {
      url: `/uploads/${businessId}/${name}`,
      name: file.name || name,
      size: file.size,
      type: file.type,
    };
  },

  async remove(url) {
    if (!url.startsWith("/uploads/")) return;
    const target = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await fs.rm(target, { force: true });
  },
};

export function getStorage(): StorageAdapter {
  return localAdapter;
}
