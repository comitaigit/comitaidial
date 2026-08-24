"use client";

import { create } from "zustand";
import {
  getContentPill,
  getOverviewKpis,
  getTaskList,
  type ContentPill,
  type OverviewKpis,
  type TaskListItem,
  type WindowDays,
} from "@/features/overview/data/overview-api";

type AsyncStatus = "idle" | "loading" | "loaded" | "error";

type OverviewState = {
  windowDays: WindowDays;
  setWindowDays: (days: WindowDays) => void;

  kpis: OverviewKpis | null;
  kpisStatus: AsyncStatus;
  kpisError: string | null;

  pill: ContentPill | null;
  pillStatus: AsyncStatus;
  pillError: string | null;

  tasks: TaskListItem[];
  tasksStatus: AsyncStatus;
  tasksError: string | null;

  fetchAll: (accessToken: string) => Promise<void>;
};

export const useOverviewStore = create<OverviewState>((set, get) => ({
  windowDays: 7,
  setWindowDays: (days) => set({ windowDays: days }),

  kpis: null,
  kpisStatus: "idle",
  kpisError: null,

  pill: null,
  pillStatus: "idle",
  pillError: null,

  tasks: [],
  tasksStatus: "idle",
  tasksError: null,

  fetchAll: async (accessToken) => {
    const { windowDays } = get();
    set({ kpisStatus: "loading", kpisError: null, pillStatus: "loading", pillError: null });

    const kpisPromise = getOverviewKpis(accessToken, windowDays)
      .then((kpis) => set({ kpis, kpisStatus: "loaded" }))
      .catch((err) =>
        set({
          kpisStatus: "error",
          kpisError: err instanceof Error ? err.message : "Failed to load KPIs.",
        }),
      );

    const pillPromise = getContentPill(accessToken, windowDays)
      .then((pill) => set({ pill, pillStatus: "loaded" }))
      .catch((err) =>
        set({
          pillStatus: "error",
          pillError: err instanceof Error ? err.message : "Failed to load content pill.",
        }),
      );

    if (get().tasksStatus === "idle") {
      set({ tasksStatus: "loading", tasksError: null });
      void getTaskList(accessToken)
        .then((tasks) => set({ tasks, tasksStatus: "loaded" }))
        .catch((err) =>
          set({
            tasksStatus: "error",
            tasksError: err instanceof Error ? err.message : "Failed to load tasks.",
          }),
        );
    }

    await Promise.all([kpisPromise, pillPromise]);
  },
}));
