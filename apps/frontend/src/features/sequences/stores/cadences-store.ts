"use client";

import { create } from "zustand";
import { listCadences, type Cadence } from "@/features/sequences/data/cadences-api";

type CadencesState = {
  cadences: Cadence[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchCadences: (accessToken: string) => Promise<void>;
  addCadence: (cadence: Cadence) => void;
};

export const useCadencesStore = create<CadencesState>((set) => ({
  cadences: [],
  status: "idle",
  error: null,
  fetchCadences: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const cadences = await listCadences(accessToken);
      set({ cadences, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load cadences.",
      });
    }
  },
  // The create response doesn't include _count (Prisma's plain `create`
  // doesn't join it), so the caller fills it in (e.g. steps.length after
  // adding drafted steps) rather than this store re-fetching the list.
  addCadence: (cadence) =>
    set((state) => ({ cadences: [cadence, ...state.cadences] })),
}));
