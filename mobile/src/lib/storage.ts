import * as SecureStore from "expo-secure-store";

/**
 * Small persistent values — the session token, the chosen business, the
 * theme — in the phone's Keychain / Keystore. Reads that fail come back
 * empty rather than throwing, so a storage hiccup means "signed out", not a
 * crash.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* already gone */
    }
  },
};
