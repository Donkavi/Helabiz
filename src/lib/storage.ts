import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Storage abstraction for uploaded files.
 *
 * Two adapters. Cloudinary is used when its three environment variables are
 * set, otherwise bytes go to `public/uploads`, which works locally and on any
 * server with a writable disk. Nothing outside this file knows which is in
 * play or where bytes actually live.
 */
export type StoredFile = { url: string; name: string; size: number; type: string; ref?: string };

/**
 * What is being uploaded. Product photos are images only; a deposit slip is
 * just as often a PDF from a banking app, and is filed separately so slips
 * never appear in the media library.
 */
export type UploadKind = "media" | "slip";

export interface StorageAdapter {
  put(input: { businessId: string; file: File; kind?: UploadKind }): Promise<StoredFile>;
  remove(url: string, ref?: string): Promise<void>;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

const SLIP_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

const MAX_BYTES = 6 * 1024 * 1024;

export class UploadError extends Error {}

/** Shared validation, so both adapters reject the same things for the same reasons. */
function check(file: File, kind: UploadKind) {
  const allowed = kind === "slip" ? SLIP_TYPES : IMAGE_TYPES;
  if (!allowed[file.type]) {
    throw new UploadError(
      kind === "slip"
        ? "Upload the slip as a JPG, PNG or PDF."
        : "That file type is not supported. Use JPG, PNG, WebP, GIF or SVG.",
    );
  }
  if (file.size > MAX_BYTES) throw new UploadError("Files must be 6MB or smaller.");
  return allowed[file.type];
}

const localAdapter: StorageAdapter = {
  async put({ businessId, file, kind = "media" }) {
    const ext = check(file, kind);
    const folder = kind === "slip" ? "slips" : "media";
    const name = `${crypto.randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", businessId, folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return {
      url: `/uploads/${businessId}/${folder}/${name}`,
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

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function cloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Cloudinary's signature: the parameters that are being sent, sorted by key
 * and joined like a query string, with the API secret appended and the whole
 * thing hashed. The secret is never transmitted.
 */
function sign(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(payload + apiSecret).digest("hex");
}

function cloudinaryAdapter(config: CloudinaryConfig): StorageAdapter {
  return {
    async put({ businessId, file, kind = "media" }) {
      check(file, kind);

      // PDFs are not images to Cloudinary; `auto` lets it decide.
      const resourceType = file.type === "application/pdf" ? "auto" : "image";
      const folder = `helabiz/${businessId}/${kind === "slip" ? "slips" : "media"}`;
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const signed: Record<string, string> = { folder, timestamp };
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", config.apiKey);
      body.append("folder", folder);
      body.append("timestamp", timestamp);
      body.append("signature", sign(signed, config.apiSecret));

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
        { method: "POST", body },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        // The reason is for the logs; the person just needs to know to retry.
        console.error("Cloudinary upload failed", response.status, detail);
        throw new UploadError("The upload could not be saved. Please try again.");
      }

      const result = (await response.json()) as {
        secure_url: string;
        public_id: string;
        bytes?: number;
        resource_type?: string;
      };

      return {
        url: result.secure_url,
        name: file.name || result.public_id,
        size: result.bytes ?? file.size,
        type: file.type,
        // Kept so the file can be deleted later: the URL alone is not enough.
        ref: `${result.resource_type ?? "image"}:${result.public_id}`,
      };
    },

    async remove(url, ref) {
      // Local-adapter leftovers can still be deleted after a switch.
      if (url.startsWith("/uploads/")) return localAdapter.remove(url);
      if (!ref) return;

      const [resourceType, ...rest] = ref.split(":");
      const publicId = rest.join(":");
      if (!publicId) return;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = new FormData();
      body.append("public_id", publicId);
      body.append("api_key", config.apiKey);
      body.append("timestamp", timestamp);
      body.append("signature", sign({ public_id: publicId, timestamp }, config.apiSecret));

      await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`, {
        method: "POST",
        body,
      }).catch((error) => {
        // A file left behind in Cloudinary must not fail the user's action.
        console.error("Cloudinary delete failed", error);
      });
    },
  };
}

/**
 * A URL a reviewer can actually open.
 *
 * Cloudinary refuses to deliver PDFs on accounts where the format is blocked
 * for security — the default on free plans — so linking a PDF slip straight
 * from storage gives the reviewer a 401. Delivering its first page rendered to
 * JPEG sidesteps that, because the delivered format is no longer a PDF, and a
 * deposit slip is one page in practice.
 *
 * Anything that is not a Cloudinary PDF is returned untouched, so local
 * uploads and photographed slips are unaffected.
 */
export function viewableUrl(url: string) {
  if (!url.includes("res.cloudinary.com") || !/\.pdf$/i.test(url)) return url;

  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (at < 0) return url;

  const head = url.slice(0, at + marker.length);
  const tail = url.slice(at + marker.length);
  return head + "f_jpg,pg_1/" + tail.replace(/\.pdf$/i, ".jpg");
}
export function getStorage(): StorageAdapter {
  const config = cloudinaryConfig();
  return config ? cloudinaryAdapter(config) : localAdapter;
}

/** Whether uploads are going to Cloudinary, for the admin panel to report. */
export function storageBackend() {
  return cloudinaryConfig() ? "cloudinary" : "local";
}
