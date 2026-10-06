"use client";

import { create } from "zustand";
import { getHubSpotStatus, type HubSpotStatus } from "@/features/hubspot/data/hubspot-api";

type HubSpotState = {
  status: "idle" | "loading" | "loaded" | "error";
  hubspotStatus: HubSpotStatus | null;
  error: string | null;
  fetchStatus: (accessToken: string) => Promise<void>;
  setHubSpotStatus: (hubspotStatus: HubSpotStatus) => void;
};

export const useHubSpotStore = create<HubSpotState>((set) => ({
  status: "idle",
  hubspotStatus: null,
  error: null,
  fetchStatus: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const hubspotStatus = await getHubSpotStatus(accessToken);
      set({ hubspotStatus, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load HubSpot status.",
      });
    }
  },
  setHubSpotStatus: (hubspotStatus) => set({ hubspotStatus }),
}));
