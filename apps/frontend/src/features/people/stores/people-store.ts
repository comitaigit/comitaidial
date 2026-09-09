"use client";

import { create } from "zustand";
import { listPeople, type Person } from "@/features/people/data/people-api";

type PeopleState = {
  people: Person[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchPeople: (accessToken: string) => Promise<void>;
  addPerson: (person: Person) => void;
};

export const usePeopleStore = create<PeopleState>((set) => ({
  people: [],
  status: "idle",
  error: null,
  fetchPeople: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const people = await listPeople(accessToken);
      set({ people, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load prospects.",
      });
    }
  },
  addPerson: (person) => set((state) => ({ people: [person, ...state.people] })),
}));
