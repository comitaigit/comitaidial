"use client";

import { useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useAccountsStore } from "@/features/accounts/stores/accounts-store";
import {
  importAccounts,
  type ImportAccountsResult,
} from "@/features/accounts/data/accounts-api";

export function useImportAccountsForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts);

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportAccountsResult | null>(null);

  async function importCsv() {
    if (!accessToken || !file || submitting) return;

    setSubmitting(true);
    setResult(null);
    try {
      const csv = await file.text();
      const outcome = await importAccounts(csv, accessToken);
      setResult(outcome);
      await fetchAccounts(accessToken);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível importar o CSV.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    file,
    setFile,
    submitting,
    result,
    canSubmit: !!file && !submitting,
    importCsv,
  };
}
