"use client";

import { create } from "zustand";

// Cross-cutting UI state: which cadence the Dialer currently has selected,
// shown in the Topbar (replaces the old hardcoded "Conta: Humand" text).
// Lives in shell because the Topbar — the one cross-cutting slice — reads
// it; the Dialer writes it when the BDR picks a cadence to work.
type ActiveCadenceState = {
  label: string | null;
  setActiveCadenceLabel: (label: string | null) => void;
};

export const useActiveCadenceStore = create<ActiveCadenceState>((set) => ({
  label: null,
  setActiveCadenceLabel: (label) => set({ label }),
}));
