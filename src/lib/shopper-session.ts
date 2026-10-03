import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sign-in for the customers of a published website ("shoppers").
 *
 * Deliberately separate from Auth.js, which signs in shop owners: a shopper is
 * a `Customer` of one business, not a `User` of Helabiz, and must never be
 * able to reach the dashboard. The session is a signed cookie holding the
 * customer id, the business id and the account's session version, checked
 * against the database on every read so a password change ends it.
 *
 * The cookie is named per business. In development every shop shares the
 * `localhost` origin, so one browser can be signed in to several shops at
 * once without them overwriting each other; in production each shop has its
 * own subdomain and the cookie is host-only anyway.
 */
export const SHOPPER_SESSION_DAYS = 30;

type Payload = { c: string; b: string; v: number; e: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET must be set to sign shopper sessions");
  return value;
}

function sign(body: string) {
  return crypto.createHmac("sha256", secret()).update(`shopper:${body}`).digest("base64url");
}

export function shopperCookieName(businessId: string) {
  return `hb_shopper_${businessId}`;
}

function encode(payload: Payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (typeof payload.c !== "string" || typeof payload.b !== "string" || payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Starts a session. Call from a route handler or server action only. */
export async function setShopperSession(businessId: string, customerId: string, sessionVersion: number) {
  const expires = Date.now() + SHOPPER_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const jar = await cookies();
  jar.set(shopperCookieName(businessId), encode({ c: customerId, b: businessId, v: sessionVersion, e: expires }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expires),
  });
}

export async function clearShopperSession(businessId: string) {
  const jar = await cookies();
  jar.delete(shopperCookieName(businessId));
}

/**
 * The signed-in customer id for this business, without touching the database.
 *
 * Only the signature and expiry are checked here; `currentShopper` in the
 * shopper service adds the session-version check. Use that one.
 */
export async function readShopperSession(businessId: string): Promise<{ customerId: string; version: number } | null> {
  const jar = await cookies();
  const payload = decode(jar.get(shopperCookieName(businessId))?.value);
  if (!payload || payload.b !== businessId) return null;
  return { customerId: payload.c, version: payload.v };
}
