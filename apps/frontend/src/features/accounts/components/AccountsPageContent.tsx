"use client";

import { AccountsTable } from "@/features/accounts/components/AccountsTable";
import { useAccountsPage } from "@/features/accounts/hooks/useAccountsPage";

export function AccountsPageContent() {
  const { accounts, isLoading, error } = useAccountsPage();

  if (isLoading) return <p className="text-sm text-muted">Carregando accounts…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  return <AccountsTable accounts={accounts} />;
}
