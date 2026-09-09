"use client";

import { create } from "zustand";
import { getFunnel, type Funnel, type WindowDays } from "@/features/funnel/data/funnel-api";

type AsyncStatus = "idle" | "loading" | "loaded" | "error";

type FunnelState = {
  period: WindowDays;
  setPeriod: (period: WindowDays) => void;

  funnel: Funnel | null;
  status: AsyncStatus;
  error: string | null;

  fetchFunnel: (accessToken: string) => Promise<void>;
};

export const useFunnelStore = create<FunnelState>((set, get) => ({
  period: 7,
  setPeriod: (period) => set({ period }),

  funnel: null,
  status: "idle",
  error: null,

  fetchFunnel: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const funnel = await getFunnel(accessToken, get().period);
      set({ funnel, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load funnel.",
      });
    }
  },
}));
