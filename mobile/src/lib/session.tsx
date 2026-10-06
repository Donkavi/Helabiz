import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { sessionStore } from "./session-store";
import type { Business, SessionResponse, SignInResponse, User } from "./types";
import { deviceInfo } from "./notifications";

type SessionContext = {
  /** Secure storage has been read; until then nothing knows whether we are signed in. */
  ready: boolean;
  signedIn: boolean;
  user: User | null;
  businesses: Business[];
  business: Business | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchBusiness: (businessId: string) => Promise<void>;
};

const Context = createContext<SessionContext | null>(null);

/** The first business that is open, so a lapsed one is not the default view. */
function pickBusiness(businesses: Business[], preferred: string | null) {
  return (
    businesses.find((b) => b.id === preferred)?.id ??
    businesses.find((b) => !b.locked && b.status !== "suspended")?.id ??
    businesses[0]?.id ??
    null
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const snapshot = useSyncExternalStore(sessionStore.subscribe, sessionStore.get);

  useEffect(() => {
    void sessionStore.load();
  }, []);

  const session = useQuery({
    queryKey: ["session", snapshot.token],
    queryFn: () => api<SessionResponse>("/api/mobile/session"),
    enabled: Boolean(snapshot.token),
    staleTime: 5 * 60_000,
  });

  // Signing out anywhere — including a 401 from the API client — drops every
  // cached screen, so the next account never sees the last one's numbers.
  useEffect(() => {
    if (snapshot.ready && !snapshot.token) queryClient.clear();
  }, [snapshot.ready, snapshot.token, queryClient]);

  // Keep the chosen business valid: removed from a team, or a first launch.
  const businesses = session.data?.businesses ?? [];
  useEffect(() => {
    if (!session.data) return;
    const valid = pickBusiness(session.data.businesses, snapshot.businessId);
    if (valid && valid !== snapshot.businessId) void sessionStore.setBusiness(valid);
  }, [session.data, snapshot.businessId]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await api<SignInResponse>("/api/mobile/session", {
        method: "POST",
        body: { email: email.trim(), password, ...deviceInfo() },
      });
      queryClient.setQueryData(["session", result.token], { user: result.user, businesses: result.businesses });
      await sessionStore.signIn(result.token, pickBusiness(result.businesses, null));
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    // Deleting the server-side session also stops this phone's notifications.
    await api("/api/mobile/session", { method: "DELETE" }).catch(() => undefined);
    await sessionStore.clear();
  }, []);

  const switchBusiness = useCallback(
    async (businessId: string) => {
      if (businessId === sessionStore.get().businessId) return;
      await sessionStore.setBusiness(businessId);
      // Every screen's data belongs to the old business; refetch it all.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" });
    },
    [queryClient],
  );

  const value = useMemo<SessionContext>(
    () => ({
      ready: snapshot.ready,
      signedIn: Boolean(snapshot.token),
      user: session.data?.user ?? null,
      businesses,
      business: businesses.find((b) => b.id === snapshot.businessId) ?? null,
      signIn,
      signOut,
      switchBusiness,
    }),
    [snapshot, session.data, businesses, signIn, signOut, switchBusiness],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
