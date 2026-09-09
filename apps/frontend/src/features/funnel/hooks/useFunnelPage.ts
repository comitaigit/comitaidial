"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useFunnelStore } from "@/features/funnel/stores/funnel-store";

export function useFunnelPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { period, setPeriod, funnel, status, error, fetchFunnel } = useFunnelStore();

  useEffect(() => {
    if (accessToken) fetchFunnel(accessToken);
  }, [accessToken, period, fetchFunnel]);

  return {
    period,
    setPeriod,
    funnel,
    isLoading: status === "loading" || status === "idle",
    error,
  };
}
