"use client";

import { useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import {
  updateCallOutcome,
  type CallOutcome,
  type NotInterestedReason,
  type TaskChannel,
} from "@/features/dialer/data/dialer-api";

export type OutcomeKind = "retry" | "final" | "invalid";

export const OUTCOME_OPTIONS: Array<{ value: CallOutcome; label: string; kind: OutcomeKind }> = [
  { value: "NO_ANSWER", label: "Não atendeu", kind: "retry" },
  { value: "VOICEMAIL", label: "Caixa postal", kind: "retry" },
  { value: "BUSY", label: "Ocupado", kind: "retry" },
  { value: "INVALID_NUMBER", label: "Não existe", kind: "invalid" },
  { value: "WRONG_PERSON", label: "Pessoa errada", kind: "final" },
  { value: "CALLBACK_REQUESTED", label: "Solicitou retorno", kind: "final" },
  { value: "MEETING_SCHEDULED", label: "Agendado", kind: "final" },
  { value: "NOT_INTERESTED", label: "Sem interesse", kind: "final" },
];

export const NOT_INTERESTED_REASON_OPTIONS: Array<{
  value: NotInterestedReason;
  label: string;
}> = [
  { value: "BUDGET", label: "Budget" },
  { value: "NOT_INTERESTED", label: "Sem interesse" },
  { value: "PRODUCT_FEEDBACK", label: "Feedback de produto" },
  { value: "USES_COMPETITOR", label: "Já usa concorrente" },
  { value: "DOES_NOT_WANT_TO_TALK", label: "Não quer falar conosco" },
];

export const CHANNEL_OPTIONS: Array<{ value: TaskChannel; label: string }> = [
  { value: "CALL", label: "Ligação" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "LINKEDIN", label: "LinkedIn" },
];

export function useOutcomeForm(
  callId: string | null,
  durationSeconds: number | null,
  onSaved: (kind: OutcomeKind) => void,
) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();

  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [notInterestedReason, setNotInterestedReason] = useState<NotInterestedReason | "">("");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [callbackChannel, setCallbackChannel] = useState<TaskChannel | "">("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const [suppressNumber, setSuppressNumber] = useState(false);
  const [saving, setSaving] = useState(false);

  function selectOutcome(value: CallOutcome) {
    setOutcome(value);
  }

  function reset() {
    setOutcome(null);
    setNotInterestedReason("");
    setCallbackDate("");
    setCallbackTime("");
    setCallbackChannel("");
    setCallbackNotes("");
    setSuppressNumber(false);
  }

  const needsNotInterestedReason = outcome === "NOT_INTERESTED";
  const needsCallbackFields = outcome === "CALLBACK_REQUESTED";

  const canSubmit =
    !!outcome &&
    !!callId &&
    !saving &&
    (!needsNotInterestedReason || !!notInterestedReason) &&
    (!needsCallbackFields || (!!callbackDate && !!callbackTime && !!callbackChannel));

  async function submit() {
    if (!accessToken || !callId || !outcome || !canSubmit) return;

    setSaving(true);
    try {
      await updateCallOutcome(
        callId,
        {
          outcome,
          durationSeconds: durationSeconds ?? undefined,
          notInterestedReason: needsNotInterestedReason
            ? (notInterestedReason as NotInterestedReason)
            : undefined,
          callbackDueAt: needsCallbackFields
            ? new Date(`${callbackDate}T${callbackTime}`).toISOString()
            : undefined,
          callbackChannel: needsCallbackFields ? (callbackChannel as TaskChannel) : undefined,
          callbackNotes: needsCallbackFields ? callbackNotes.trim() || undefined : undefined,
          suppressNumber: suppressNumber || undefined,
        },
        accessToken,
      );

      const option = OUTCOME_OPTIONS.find((o) => o.value === outcome);
      toast(`Outcome registrado: ${option?.label ?? outcome}.`);
      const kind = option?.kind ?? "final";
      reset();
      onSaved(kind);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível registrar o outcome.");
    } finally {
      setSaving(false);
    }
  }

  return {
    outcome,
    selectOutcome,
    notInterestedReason,
    setNotInterestedReason,
    callbackDate,
    setCallbackDate,
    callbackTime,
    setCallbackTime,
    callbackChannel,
    setCallbackChannel,
    callbackNotes,
    setCallbackNotes,
    suppressNumber,
    setSuppressNumber,
    needsNotInterestedReason,
    needsCallbackFields,
    saving,
    canSubmit,
    submit,
  };
}
