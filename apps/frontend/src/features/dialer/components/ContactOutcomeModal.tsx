"use client";

import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { AccountPriority, InfluenceLevel, QueueItem } from "@/features/dialer/data/dialer-api";
import {
  CHANNEL_OPTIONS,
  NOT_INTERESTED_REASON_OPTIONS,
  OUTCOME_OPTIONS,
  useOutcomeForm,
  type OutcomeKind,
} from "@/features/dialer/hooks/useOutcomeForm";

const PERSONA_LABEL: Record<InfluenceLevel, string> = {
  FINANCIAL_DECISION_MAKER: "Decisor financeiro",
  DIRECT_INFLUENCER: "Influenciador direto",
  OPERATIONAL_DECISION_MAKER: "Decisor operacional",
  INDIRECT_INFLUENCER: "Influenciador indireto",
};

const PRIORITY_LABEL: Record<AccountPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const PRIORITY_VARIANT: Record<AccountPriority, "bad" | "warn" | "default"> = {
  HIGH: "bad",
  MEDIUM: "warn",
  LOW: "default",
};

// Content-only — rendered inside the global modal (openModal supplies the
// overlay/header/close button), triggered by useDialerStage the moment an
// attempt needs an outcome. Every field here was previously stuck in a
// permanently-visible "Contato atual" card; this is the same form, just
// as a popup for registro instead of fixed screen real estate.
export function ContactOutcomeModal({
  person,
  callId,
  durationSeconds,
  onSaved,
}: {
  person: QueueItem | null;
  callId: string | null;
  durationSeconds: number | null;
  onSaved: (kind: OutcomeKind) => void;
}) {
  const {
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
  } = useOutcomeForm(callId, durationSeconds, onSaved);

  return (
    <div className="grid gap-2.5">
      {person ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <b className="text-[15px]">{person.name}</b>
            {person.priority ? (
              <Tag variant={PRIORITY_VARIANT[person.priority]}>
                {PRIORITY_LABEL[person.priority]}
              </Tag>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {person.role ?? "—"} · {person.phone}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            {person.accountName}
            {person.persona ? ` · ${PERSONA_LABEL[person.persona]}` : ""}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">Nenhum contato selecionado.</p>
      )}

      <div className="grid gap-2.5">
        <div className="mt-1 flex items-center justify-between">
          <b className="text-xs">Outcome obrigatório</b>
          <span className="text-[10px] text-muted">1 toque</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => selectOutcome(option.value)}
              className={cn(
                "rounded-lg border border-line bg-panel px-2.5 py-2 text-left text-[11px]",
                outcome === option.value && "border-accent bg-soft"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {needsNotInterestedReason ? (
          <Field label="Motivo">
            <Select
              value={notInterestedReason}
              onChange={(e) =>
                setNotInterestedReason(e.target.value as typeof notInterestedReason)
              }
            >
              <option value="">Selecione…</option>
              {NOT_INTERESTED_REASON_OPTIONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {needsCallbackFields ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Data do retorno">
                <Input
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                />
              </Field>
              <Field label="Hora">
                <Input
                  type="time"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Canal combinado">
              <Select
                value={callbackChannel}
                onChange={(e) => setCallbackChannel(e.target.value as typeof callbackChannel)}
              >
                <option value="">Selecione…</option>
                {CHANNEL_OPTIONS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="O que foi combinado (opcional)">
              <Textarea
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                placeholder="Ex.: retornar depois que ela alinhar com o financeiro."
              />
            </Field>
          </>
        ) : null}

        <label className="flex items-center gap-2 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={suppressNumber}
            onChange={(e) => setSuppressNumber(e.target.checked)}
          />
          Não discar mais para esse número
        </label>

        <Button variant="primary" onClick={submit} disabled={!canSubmit}>
          {saving ? "Registrando…" : "Registrar outcome"}
        </Button>
      </div>
    </div>
  );
}
