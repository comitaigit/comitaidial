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
  // A freshly created cadence has no steps/enrollments yet — the create
  // response doesn't include _count (Prisma's plain `create` doesn't join
  // it), so it's filled in here rather than re-fetching the whole list.
  addCadence: (cadence) =>
    set((state) => ({
      cadences: [
        { ...cadence, _count: { steps: 0, enrollments: 0 } },
        ...state.cadences,
      ],
    })),
}));
