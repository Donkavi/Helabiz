import { sessionStore } from "./session-store";

/**
 * The one way the app talks to the Helabiz server.
 *
 * Sends the bearer token and the business being viewed on every request; the
 * server checks both. A 401 means the token is dead (signed out elsewhere,
 * account disabled, idle too long), so the phone signs itself out.
 */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("This app is not connected to a Helabiz server. Set EXPO_PUBLIC_API_URL and restart.", 0, "config");
  }

  const { token, businessId } = sessionStore.get();
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (businessId) headers["x-business-id"] = businessId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Could not reach Helabiz. Check your internet connection and try again.", 0, "offline");
  } finally {
    clearTimeout(timer);
  }

  const payload = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!response.ok) {
    if (response.status === 401 && token) void sessionStore.clear();
    throw new ApiError(payload.error ?? "Something went wrong. Please try again.", response.status, payload.code);
  }
  return payload as T;
}

/** Product images and logos may be stored as paths on the web app. */
export function imageUrl(src: string | null | undefined) {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return `${API_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}
