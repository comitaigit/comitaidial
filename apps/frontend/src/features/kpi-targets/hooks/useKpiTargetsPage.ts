"use client";

import { useEffect, useMemo } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useKpiTargetsStore } from "@/features/kpi-targets/stores/kpi-targets-store";

export function useKpiTargetsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
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
    status,
    error,
    accounts,
    fetchReport,
    fetchAccounts,
  } = useKpiTargetsStore();

  useEffect(() => {
    if (accessToken) fetchAccounts(accessToken);
  }, [accessToken, fetchAccounts]);

  useEffect(() => {
    if (accessToken) fetchReport(accessToken);
  }, [accessToken, from, to, accountId, outcome, fetchReport]);

  const visibleRows = useMemo(
    () => (userId ? rows.filter((r) => r.userId === userId) : rows),
    [rows, userId],
  );

  return {
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
    rows: visibleRows,
    allUsers: rows.map((r) => ({ id: r.userId, name: r.userName })),
    isLoading: status === "loading" || status === "idle",
    error,
    accounts,
  };
}
