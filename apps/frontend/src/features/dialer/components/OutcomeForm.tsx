"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { QueueItem } from "@/features/dialer/data/dialer-api";
import {
  CHANNEL_OPTIONS,
  NOT_INTERESTED_REASON_OPTIONS,
  OUTCOME_OPTIONS,
  useOutcomeForm,
  type OutcomeKind,
} from "@/features/dialer/hooks/useOutcomeForm";

export function OutcomeForm({
  person,
  callId,
  durationSeconds,
  active,
  onSaved,
}: {
  person: QueueItem | null;
  callId: string | null;
  durationSeconds: number | null;
  active: boolean;
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
    <Card>
      <CardHead>
        <CardTitle>Contato atual</CardTitle>
        {person ? <Tag>{person.accountName}</Tag> : null}
      </CardHead>
      <CardBody className="grid gap-2.5">
        {person ? (
          <div>
            <b className="block text-[13px]">{person.name}</b>
            <span className="text-[11px] text-muted">
              {person.role ?? "—"} · {person.phone}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted">Nenhum contato selecionado.</p>
        )}

        <div className={cn("grid gap-2.5", !active && "pointer-events-none opacity-45")}>
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
      </CardBody>
    </Card>
  );
}
