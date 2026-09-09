"use client";

import { FiltersBar } from "@/features/kpi-targets/components/FiltersBar";
import { ReportTable } from "@/features/kpi-targets/components/ReportTable";
import { useKpiTargetsPage } from "@/features/kpi-targets/hooks/useKpiTargetsPage";

export function KpiTargetsPageContent() {
  const {
    from,
    to,
    accountId,
    outcome,
    userId,
    setFrom,
    setTo,
    setAccountId,
    setOutcome,
    setUserId,
    rows,
    allUsers,
    isLoading,
    error,
    accounts,
  } = useKpiTargetsPage();

  return (
    <section>
      <FiltersBar
        from={from}
        to={to}
        accountId={accountId}
        outcome={outcome}
        userId={userId}
        accounts={accounts}
        users={allUsers}
        onFromChange={setFrom}
        onToChange={setTo}
        onAccountChange={setAccountId}
        onOutcomeChange={setOutcome}
        onUserChange={setUserId}
      />

      <div className="mt-3.5">
        {error ? (
          <p className="text-sm text-bad">{error}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted">Carregando relatório…</p>
        ) : (
          <ReportTable rows={rows} />
        )}
      </div>
    </section>
  );
}
