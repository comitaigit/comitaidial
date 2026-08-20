"use client";

import type { ReactNode } from "react";
import { useSessionBootstrap } from "@/features/auth/hooks/useSessionBootstrap";

/** Wraps the authenticated app shell; blocks render until a session is confirmed. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isChecking, status } = useSessionBootstrap();

  if (isChecking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted">Carregando…</p>
      </div>
    );
  }

  if (status !== "authenticated") return null; // redirect already in flight

  return <>{children}</>;
}
