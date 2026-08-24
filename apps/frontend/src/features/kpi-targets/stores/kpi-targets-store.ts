"use client";

import { create } from "zustand";
import {
  getAccountsForFilter,
  getReport,
  type AccountOption,
  type CallOutcome,
  type GoalReportRow,
} from "@/features/kpi-targets/data/goals-api";

type AsyncStatus = "idle" | "loading" | "loaded" | "error";

type KpiTargetsState = {
  from: string;
  to: string;
  accountId: string;
  outcome: CallOutcome | "";
  userId: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setAccountId: (v: string) => void;
  setOutcome: (v: CallOutcome | "") => void;
  setUserId: (v: string) => void;

  rows: GoalReportRow[];
  status: AsyncStatus;
  error: string | null;

  accounts: AccountOption[];
  accountsStatus: AsyncStatus;

  fetchReport: (accessToken: string) => Promise<void>;
  fetchAccounts: (accessToken: string) => Promise<void>;
};

export const useKpiTargetsStore = create<KpiTargetsState>((set, get) => ({
  from: "",
  to: "",
  accountId: "",
  outcome: "",
  userId: "",
  setFrom: (v) => set({ from: v }),
  setTo: (v) => set({ to: v }),
  setAccountId: (v) => set({ accountId: v }),
  setOutcome: (v) => set({ outcome: v }),
  setUserId: (v) => set({ userId: v }),

  rows: [],
  status: "idle",
  error: null,

  accounts: [],
  accountsStatus: "idle",

  fetchReport: async (accessToken) => {
    const { from, to, accountId, outcome } = get();
    set({ status: "loading", error: null });
    try {
      const rows = await getReport(accessToken, {
        from: from || undefined,
        to: to || undefined,
        accountId: accountId || undefined,
        outcome: outcome || undefined,
      });
      set({ rows, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load report.",
      });
    }
  },

  fetchAccounts: async (accessToken) => {
    set({ accountsStatus: "loading" });
    try {
      const accounts = await getAccountsForFilter(accessToken);
      set({ accounts, accountsStatus: "loaded" });
    } catch {
      set({ accountsStatus: "error" });
    }
  },
}));
