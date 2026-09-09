"use client";

import { create } from "zustand";
import { listCalls, type Call } from "@/features/calls/data/calls-api";

type CallsState = {
  calls: Call[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchCalls: (accessToken: string) => Promise<void>;
};

export const useCallsStore = create<CallsState>((set) => ({
  calls: [],
  status: "idle",
  error: null,
  fetchCalls: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const calls = await listCalls(accessToken);
      set({ calls, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load calls.",
      });
    }
  },
}));
