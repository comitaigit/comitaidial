import { create } from "zustand";
import type { AuthUser } from "@/features/auth/data/auth-api";

type SessionState = {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: SessionState["status"]) => void;
};

/**
 * Access token lives only in memory (this store), never localStorage or a
 * non-httpOnly cookie — the standard XSS mitigation for JWTs. It's lost on a
 * full page reload by design; `useSessionBootstrap` silently re-derives it
 * from the httpOnly refresh cookie via POST /auth/refresh.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken) =>
    set({ user, accessToken, status: "authenticated" }),
  clearSession: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));
