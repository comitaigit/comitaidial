"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useCallsStore } from "@/features/calls/stores/calls-store";

export function useCallsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { calls, status, error, fetchCalls } = useCallsStore();

  useEffect(() => {
    if (accessToken) fetchCalls(accessToken);
  }, [accessToken, fetchCalls]);

  return { calls, isLoading: status === "loading" || status === "idle", error };
}
