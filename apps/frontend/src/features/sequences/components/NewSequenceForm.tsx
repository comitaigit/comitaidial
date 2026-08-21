"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Tag } from "@/components/ui/Tag";
import { useNewSequenceForm } from "@/features/sequences/hooks/useNewSequenceForm";
import type { CadenceStepType } from "@/features/sequences/data/cadences-api";

const STEP_TYPE_LABEL: Record<CadenceStepType, string> = {
  CALL: "Ligação",
  AUTOMATIC_EMAIL: "E-mail automático",
  MANUAL_EMAIL: "E-mail manual",
  MANUAL_SMS: "SMS manual",
  WHATSAPP_MESSAGE: "WhatsApp",
  ACTION_ITEM: "Tarefa manual",
  LINKEDIN_CONNECTION_REQUEST: "Convite LinkedIn",
  LINKEDIN_MESSAGE: "Mensagem LinkedIn",
};

export function NewSequenceForm() {
  const {
    name,
    setName,
    steps,
    draftType,
    setDraftType,
    draftDayOffset,
    setDraftDayOffset,
    draftNotes,
    setDraftNotes,
    draftWaitForAccept,
    setDraftWaitForAccept,
    addDraftStep,
    removeDraftStep,
    submitting,
    canSubmit,
    create,
  } = useNewSequenceForm();

  return (
    <>
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      {steps.length > 0 && (
        <div className="mb-3 grid gap-1.5">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs"
            >
              <span>
                <b>D{step.dayOffset}</b> · {STEP_TYPE_LABEL[step.type]}
                {step.notes ? ` · ${step.notes}` : ""}
                {step.waitForConnectionAccepted ? " · aguarda aceite" : ""}
              </span>
              <button
                type="button"
                className="cursor-pointer text-muted hover:text-bad"
                onClick={() => removeDraftStep(index)}
              >
                remover
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 rounded-[9px] border border-line bg-[#fafbfc] p-2.5">
        <div className="mb-2 text-[11px] font-semibold text-[#444b55]">
          Adicionar step
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Canal">
            <Select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as CadenceStepType)}
            >
              {(Object.entries(STEP_TYPE_LABEL) as [CadenceStepType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label="Dia">
            <Input
              type="number"
              min={0}
              value={draftDayOffset}
              onChange={(e) => setDraftDayOffset(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notas (opcional)">
          <Textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} />
        </Field>
        {draftType === "LINKEDIN_CONNECTION_REQUEST" && (
          <label className="mb-2.5 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draftWaitForAccept}
              onChange={(e) => setDraftWaitForAccept(e.target.checked)}
            />
            Aguardar aceite do convite antes do próximo step
          </label>
        )}
        <Button variant="default" size="small" onClick={addDraftStep} className="w-full">
          + Adicionar step
        </Button>
      </div>

      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        WhatsApp e LinkedIn continuam ações manuais na V0 — o Dialer executa
        a fila de ligações e respeita a pausa por resposta.
      </div>

      {steps.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Tag variant="info">{steps.length} step{steps.length > 1 ? "s" : ""}</Tag>
        </div>
      )}

      <Button
        variant="primary"
        className="mt-3 w-full"
        onClick={create}
        disabled={!canSubmit}
      >
        {submitting ? "Criando…" : "Criar cadência"}
      </Button>
    </>
  );
}
