"use client";

import { create } from "zustand";
import {
  getOverviewInsight,
  getOverviewSummary,
  type OverviewSummary,
} from "@/features/overview/data/overview-api";

type AsyncStatus = "idle" | "loading" | "loaded" | "error";

type OverviewState = {
  summary: OverviewSummary | null;
  summaryStatus: AsyncStatus;
  summaryError: string | null;
  fetchSummary: (accessToken: string) => Promise<void>;

  insight: string | null;
  insightStatus: AsyncStatus;
  insightError: string | null;
  fetchInsight: (accessToken: string) => Promise<void>;
};

export const useOverviewStore = create<OverviewState>((set) => ({
  summary: null,
  summaryStatus: "idle",
  summaryError: null,
  fetchSummary: async (accessToken) => {
    set({ summaryStatus: "loading", summaryError: null });
    try {
      const summary = await getOverviewSummary(accessToken);
      set({ summary, summaryStatus: "loaded" });
    } catch (err) {
      set({
        summaryStatus: "error",
        summaryError: err instanceof Error ? err.message : "Failed to load overview.",
      });
    }
  },

  insight: null,
  insightStatus: "idle",
  insightError: null,
  fetchInsight: async (accessToken) => {
    set({ insightStatus: "loading", insightError: null });
    try {
      const { insight } = await getOverviewInsight(accessToken);
      set({ insight, insightStatus: "loaded" });
    } catch (err) {
      set({
        insightStatus: "error",
        insightError: err instanceof Error ? err.message : "Failed to load insight.",
      });
    }
  },
}));
