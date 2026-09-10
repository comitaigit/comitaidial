"use client";

import { create } from "zustand";
import {
  listPendingActions,
  listPendingProposals,
  listPendingLinkedInActions,
  type PendingAction,
  type PendingProposal,
} from "@/features/approvals/data/approvals-api";

type ApprovalsState = {
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  actions: PendingAction[];
  proposals: PendingProposal[];
  linkedinActions: PendingAction[];
  fetchAll: (accessToken: string) => Promise<void>;
  removeAction: (id: string) => void;
  removeProposal: (id: string) => void;
  removeLinkedInAction: (id: string) => void;
};

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  status: "idle",
  error: null,
  actions: [],
  proposals: [],
  linkedinActions: [],
  fetchAll: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const [actions, proposals, linkedinActions] = await Promise.all([
        listPendingActions(accessToken),
        listPendingProposals(accessToken),
        listPendingLinkedInActions(accessToken),
      ]);
      set({ actions, proposals, linkedinActions, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load approval queues.",
      });
    }
  },
  removeAction: (id) => set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),
  removeProposal: (id) => set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),
  removeLinkedInAction: (id) =>
    set((s) => ({ linkedinActions: s.linkedinActions.filter((a) => a.id !== id) })),
}));
