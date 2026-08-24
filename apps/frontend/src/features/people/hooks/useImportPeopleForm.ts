"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { usePeopleStore } from "@/features/people/stores/people-store";
import {
  importPeople,
  listCadenceOptions,
  type CadenceOption,
  type ImportPeopleResult,
} from "@/features/people/data/people-api";

export function useImportPeopleForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const fetchPeople = usePeopleStore((s) => s.fetchPeople);

  const [file, setFile] = useState<File | null>(null);
  const [cadenceOptions, setCadenceOptions] = useState<CadenceOption[]>([]);
  const [cadenceId, setCadenceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportPeopleResult | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listCadenceOptions(accessToken)
      .then(setCadenceOptions)
      .catch(() => {
        // Cadence picker just stays empty — importing without one is valid.
      });
  }, [accessToken]);

  async function importCsv() {
    if (!accessToken || !file || submitting) return;

    setSubmitting(true);
    setResult(null);
    try {
      const csv = await file.text();
      const outcome = await importPeople(csv, cadenceId || undefined, accessToken);
      setResult(outcome);
      await fetchPeople(accessToken);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível importar o CSV.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    file,
    setFile,
    cadenceOptions,
    cadenceId,
    setCadenceId,
    submitting,
    result,
    canSubmit: !!file && !submitting,
    importCsv,
  };
}
