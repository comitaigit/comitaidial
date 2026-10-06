"use client";

import { create } from "zustand";
import { getGmailStatus, type GmailStatus } from "@/features/gmail/data/gmail-api";

type GmailState = {
  status: "idle" | "loading" | "loaded" | "error";
  gmailStatus: GmailStatus | null;
  error: string | null;
  fetchStatus: (accessToken: string) => Promise<void>;
  setGmailStatus: (gmailStatus: GmailStatus) => void;
};

export const useGmailStore = create<GmailState>((set) => ({
  status: "idle",
  gmailStatus: null,
  error: null,
  fetchStatus: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const gmailStatus = await getGmailStatus(accessToken);
      set({ gmailStatus, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load Gmail status.",
      });
    }
  },
  setGmailStatus: (gmailStatus) => set({ gmailStatus }),
}));
