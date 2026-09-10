"use client";

import { AccountsTable } from "@/features/accounts/components/AccountsTable";
import { useAccountsPage } from "@/features/accounts/hooks/useAccountsPage";
import { useAccountRowActions } from "@/features/accounts/hooks/useAccountRowActions";

export function AccountsPageContent() {
  const { accounts, isLoading, error } = useAccountsPage();
  const { busyId, enrich, openFindContact } = useAccountRowActions();

  if (isLoading) return <p className="text-sm text-muted">Carregando accounts…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  return (
    <AccountsTable
      accounts={accounts}
      busyId={busyId}
      onEnrich={enrich}
      onFindContact={openFindContact}
    />
  );
}
