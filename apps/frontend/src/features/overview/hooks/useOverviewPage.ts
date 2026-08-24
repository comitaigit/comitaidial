"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useOverviewStore } from "@/features/overview/stores/overview-store";
import type { WindowDays } from "@/features/overview/data/overview-api";

export function useOverviewPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const bdrName = useSessionStore((s) => s.user?.name ?? "");
  const {
    windowDays,
    setWindowDays,
    kpis,
    kpisStatus,
    kpisError,
    pill,
    pillStatus,
    pillError,
    tasks,
    tasksStatus,
    tasksError,
    fetchAll,
  } = useOverviewStore();

  useEffect(() => {
    if (accessToken) fetchAll(accessToken);
  }, [accessToken, windowDays, fetchAll]);

  function changeWindow(days: WindowDays) {
    setWindowDays(days);
  }

  return {
    bdrName,
    windowDays,
    changeWindow,
    kpis,
    isKpisLoading: kpisStatus === "loading" || kpisStatus === "idle",
    kpisError,
    pill,
    isPillLoading: pillStatus === "loading" || pillStatus === "idle",
    pillError,
    tasks,
    isTasksLoading: tasksStatus === "loading" || tasksStatus === "idle",
    tasksError,
  };
}
