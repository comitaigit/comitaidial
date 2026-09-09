"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useSignalsStore } from "@/features/signals/stores/signals-store";

export function useSignalsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { signals, status, error, fetchSignals } = useSignalsStore();

  useEffect(() => {
    if (accessToken) fetchSignals(accessToken);
  }, [accessToken, fetchSignals]);

  return { signals, isLoading: status === "loading" || status === "idle", error };
}
