"use client";

import { create } from "zustand";
import { getEnrichmentCredits } from "@/features/enrichment/data/enrichment-api";

type EnrichmentState = {
  status: "idle" | "loading" | "loaded" | "error";
  balance: number | null;
  error: string | null;
  fetchBalance: (accessToken: string) => Promise<void>;
  setBalance: (balance: number) => void;
};

export const useEnrichmentStore = create<EnrichmentState>((set) => ({
  status: "idle",
  balance: null,
  error: null,
  fetchBalance: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const { balance } = await getEnrichmentCredits(accessToken);
      set({ balance, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load credit balance.",
      });
    }
  },
  setBalance: (balance) => set({ balance }),
}));
