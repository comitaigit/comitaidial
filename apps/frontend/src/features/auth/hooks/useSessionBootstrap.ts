"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { refresh } from "@/features/auth/data/auth-api";
import { useSessionStore } from "@/features/shell/stores/session-store";

/**
 * The access token lives only in memory, so it's gone after a full page
 * reload. On mount, silently try POST /auth/refresh — the httpOnly refresh
 * cookie (if any, and if not expired/revoked) re-establishes the session
 * without the user re-entering credentials. Redirects to /login on failure.
 *
 * Guards against React Strict Mode's dev-only double-invoke of effects with
 * a ref (not the `status` store value) — the store update from the first
 * invocation's in-flight request must still be allowed to land even after
 * its own effect's cleanup ran, otherwise `status` gets stuck at "loading"
 * forever when the second invocation's guard (`status !== "idle"`) skips
 * re-running the fetch.
 */
export function useSessionBootstrap() {
  const { status, user, setSession, setStatus } = useSessionStore();
  const router = useRouter();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setStatus("loading");

    refresh()
      .then(({ user, accessToken }) => {
        setSession(user, accessToken);
      })
      .catch(() => {
        setStatus("unauthenticated");
        router.replace("/login");
      });
    // No cleanup: the request always resolves the store to a terminal
    // status (authenticated/unauthenticated) exactly once per mount, so
    // there's nothing to cancel — see the comment above for why guarding
    // on `status` instead of this ref caused the hang this replaced.
  }, [setSession, setStatus, router]);

  return { status, user, isChecking: status === "idle" || status === "loading" };
}
