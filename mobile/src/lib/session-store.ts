import { storage } from "./storage";

/**
 * The signed-in token and the business being viewed, kept in the phone's
 * secure storage (Keychain / Keystore) so they survive restarts.
 *
 * A plain module rather than React state, because the API client reads it on
 * every request and must also be able to sign the phone out when the server
 * says the token is no longer good.
 */

const TOKEN_KEY = "helabiz.token";
const BUSINESS_KEY = "helabiz.business";

export type SessionSnapshot = { ready: boolean; token: string | null; businessId: string | null };

let snapshot: SessionSnapshot = { ready: false, token: null, businessId: null };
const listeners = new Set<() => void>();

function update(next: Partial<SessionSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export const sessionStore = {
  get: () => snapshot,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async load() {
    const [token, businessId] = await Promise.all([storage.get(TOKEN_KEY), storage.get(BUSINESS_KEY)]);
    update({ ready: true, token, businessId });
  },

  async signIn(token: string, businessId: string | null) {
    await storage.set(TOKEN_KEY, token);
    if (businessId) await storage.set(BUSINESS_KEY, businessId);
    update({ token, businessId });
  },

  async setBusiness(businessId: string) {
    await storage.set(BUSINESS_KEY, businessId);
    update({ businessId });
  },

  async clear() {
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(BUSINESS_KEY)]);
    update({ token: null, businessId: null });
  },
};
