"use client";

import { useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { type CallOutcome, updateCallOutcome } from "@/features/dialer/data/dialer-api";

export const OUTCOME_OPTIONS: Array<{ value: CallOutcome; label: string }> = [
  { value: "NO_ANSWER", label: "Sem contato" },
  { value: "VOICEMAIL", label: "Caixa postal" },
  { value: "CONVERSATION_NO_PROGRESS", label: "Conversou · sem avanço" },
  { value: "QUALIFIED_OBJECTION", label: "Objeção qualificada" },
  { value: "CALLBACK_SCHEDULED", label: "Callback agendado" },
  { value: "MEETING_SCHEDULED", label: "Reunião marcada" },
  { value: "INVALID_NUMBER", label: "Número inválido" },
  { value: "NOT_DECISION_MAKER", label: "Não é decisor" },
];

export function useOutcomePanel(
  callId: string | null,
  durationSeconds: number | null,
  onSaved: () => void,
) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [selected, setSelected] = useState<CallOutcome | null>(null);
  const [saving, setSaving] = useState(false);

  function selectOutcome(outcome: CallOutcome) {
    setSelected(outcome);
  }

  async function saveOutcome() {
    if (!selected || !callId || !accessToken) return;
    setSaving(true);
    try {
      await updateCallOutcome(
        callId,
        { outcome: selected, durationSeconds: durationSeconds ?? undefined },
        accessToken,
      );
      const label = OUTCOME_OPTIONS.find((o) => o.value === selected)?.label ?? selected;
      toast(`Outcome registrado: ${label}.`);
      setSelected(null);
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível registrar o outcome.");
    } finally {
      setSaving(false);
    }
  }

  return { selected, selectOutcome, saveOutcome, saving };
}
