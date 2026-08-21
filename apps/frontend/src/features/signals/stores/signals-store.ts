"use client";

import { create } from "zustand";
import { listSignals, type Signal } from "@/features/signals/data/signals-api";

type SignalsState = {
  signals: Signal[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchSignals: (accessToken: string) => Promise<void>;
};

export const useSignalsStore = create<SignalsState>((set) => ({
  signals: [],
  status: "idle",
  error: null,
  fetchSignals: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const signals = await listSignals(accessToken);
      set({ signals, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load signals.",
      });
    }
  },
}));
