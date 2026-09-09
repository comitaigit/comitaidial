"use client";

import { create } from "zustand";
import { listAccounts, type Account } from "@/features/accounts/data/accounts-api";

type AccountsState = {
  accounts: Account[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchAccounts: (accessToken: string) => Promise<void>;
  addAccount: (account: Account) => void;
};

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  status: "idle",
  error: null,
  fetchAccounts: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const accounts = await listAccounts(accessToken);
      set({ accounts, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load accounts.",
      });
    }
  },
  addAccount: (account) =>
    set((state) => ({ accounts: [account, ...state.accounts] })),
}));
