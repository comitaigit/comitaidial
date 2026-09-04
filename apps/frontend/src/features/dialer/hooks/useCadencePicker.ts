"use client";

import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useActiveCadenceStore } from "@/features/shell/stores/active-cadence-store";
import { listDialerCadences, type DialerCadence } from "@/features/dialer/data/dialer-api";

// Discagem paralela ainda não existe e o Dialer não tem mais uma fila única
// pro tenant inteiro — o BDR escolhe qual cadência vai trabalhar antes de
// poder discar, e a empresa/produto daquela cadência é o que os cards de IA
// usam (2026-08-25).
export function useCadencePicker() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const setActiveCadenceLabel = useActiveCadenceStore((s) => s.setActiveCadenceLabel);

  const [cadences, setCadences] = useState<DialerCadence[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [selectedCadenceId, setSelectedCadenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listDialerCadences(accessToken)
      .then((items) => {
        setCadences(items);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, [accessToken]);

  const selectedCadence = useMemo(
    () => cadences.find((c) => c.id === selectedCadenceId) ?? null,
    [cadences, selectedCadenceId],
  );
  const isIncomplete = !!selectedCadence && !selectedCadence.clientCompanyId;

  useEffect(() => {
    setActiveCadenceLabel(
      selectedCadence
        ? `Cadência: ${selectedCadence.name}${
            selectedCadence.clientCompany ? ` · ${selectedCadence.clientCompany.name}` : ""
          }`
        : null,
    );
    return () => setActiveCadenceLabel(null);
  }, [selectedCadence, setActiveCadenceLabel]);

  return {
    cadences,
    isLoading: status === "loading" || status === "idle",
    selectedCadenceId,
    setSelectedCadenceId,
    selectedCadence,
    isIncomplete,
  };
}
