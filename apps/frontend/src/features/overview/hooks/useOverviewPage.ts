"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useOverviewStore } from "@/features/overview/stores/overview-store";

export function useOverviewPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const bdrName = useSessionStore((s) => s.user?.name ?? "");
  const {
    summary,
    summaryStatus,
    summaryError,
    fetchSummary,
    insight,
    insightStatus,
    insightError,
    fetchInsight,
  } = useOverviewStore();

  useEffect(() => {
    if (!accessToken) return;
    fetchSummary(accessToken);
    fetchInsight(accessToken);
  }, [accessToken, fetchSummary, fetchInsight]);

  return {
    bdrName,
    kpis: summary?.kpis ?? null,
    workQueue: summary?.workQueue ?? [],
    isSummaryLoading: summaryStatus === "loading" || summaryStatus === "idle",
    summaryError,
    insight,
    isInsightLoading: insightStatus === "loading" || insightStatus === "idle",
    insightError,
  };
}
