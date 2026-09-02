"use client";

import { useEffect, useMemo } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useOverviewStore } from "@/features/overview/stores/overview-store";
import { toHomeTask } from "@/features/overview/data/overview-api";
import type { WindowDays } from "@/features/overview/data/overview-api";

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${prefix}, ${name.split(" ")[0]}`;
}

function getDateStr(): string {
  const now = new Date();
  const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const dayName = weekDays[now.getDay()];
  const d = now.getDate();
  const mo = months[now.getMonth()];
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${dayName}, ${d} ${mo} · semana ${week}`;
}

export function useOverviewPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useSessionStore((s) => s.user);
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

  const homeTasks = useMemo(() => tasks.map(toHomeTask), [tasks]);
  const pendingCount = useMemo(
    () => homeTasks.filter((t) => t.status !== "done").length,
    [homeTasks],
  );
  const doneCount = useMemo(
    () => homeTasks.filter((t) => t.status === "done").length,
    [homeTasks],
  );

  function changeWindow(days: WindowDays) {
    setWindowDays(days);
  }

  const bdrName = user?.name ?? "";
  const greeting = bdrName ? getGreeting(bdrName) : "";
  const dateStr = getDateStr();

  return {
    greeting,
    dateStr,
    bdrName,
    windowDays,
    changeWindow,

    // Hero metric
    conversations: kpis?.conversations ?? null,
    meetingsScheduled: kpis?.meetingsScheduled ?? null,

    // Footer stats (real data)
    footerCalls: kpis?.attempts ?? null,
    footerConnectionRate: kpis ? Math.round(kpis.connectRate * 100) : null,

    // KPI loading state
    kpis,
    isKpisLoading: kpisStatus === "loading" || kpisStatus === "idle",
    kpisError,

    // Content pill (kept for future use)
    pill,
    isPillLoading: pillStatus === "loading" || pillStatus === "idle",
    pillError,

    // Tasks
    homeTasks,
    pendingCount,
    doneCount,
    isTasksLoading: tasksStatus === "loading" || tasksStatus === "idle",
    tasksError,
  };
}
