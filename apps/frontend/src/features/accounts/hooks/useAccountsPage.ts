"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useAccountsStore } from "@/features/accounts/stores/accounts-store";

export function useAccountsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { accounts, status, error, fetchAccounts } = useAccountsStore();

  useEffect(() => {
    if (accessToken) fetchAccounts(accessToken);
  }, [accessToken, fetchAccounts]);

  return { accounts, isLoading: status === "loading" || status === "idle", error };
}
