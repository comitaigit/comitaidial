"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { QueueTable } from "@/features/dialer/components/QueueTable";
import { ResearchCard } from "@/features/dialer/components/ResearchCard";
import { CadencePicker } from "@/features/dialer/components/CadencePicker";
import { useDialerStage } from "@/features/dialer/hooks/useDialerStage";
import type { SoftphoneStatus } from "@/features/dialer/hooks/useSoftphone";

const STATUS_LABEL: Record<SoftphoneStatus, string> = {
  idle: "Softphone desconectado",
  registering: "Conectando softphone…",
  ready: "Aguardando",
  connecting: "Discando…",
  "in-call": "Em ligação",
  error: "Erro no softphone",
};

export function DialerStage() {
  const {
    softphone,
    cadencePicker,
    queue,
    research,
    currentPerson,
    starting,
    dialingPersonIds,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startCall,
    retryNow,
    hangup,
    openOutcomeModal,
  } = useDialerStage();

  const currentStatusLabel =
    pendingResultKind === "retry"
      ? `Sem resposta · tentar de novo (${retryCountdown}s)`
      : pendingResultKind === "invalid"
        ? "Número inválido"
        : STATUS_LABEL[softphone.status];

  const canCall =
    softphone.status === "ready" &&
    !!currentPerson &&
    !starting &&
    !awaitingOutcome &&
    !cadencePicker.isIncomplete;
  const canHangup = softphone.status === "connecting" || softphone.status === "in-call";

  return (
    <div className="grid gap-3.5">
      <CadencePicker
        cadences={cadencePicker.cadences}
        isLoading={cadencePicker.isLoading}
        selectedCadenceId={cadencePicker.selectedCadenceId}
        onChange={cadencePicker.setSelectedCadenceId}
        isIncomplete={cadencePicker.isIncomplete}
      />

      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line bg-panel p-3.5">
        <div className="flex items-center gap-2.5">
          <Button variant="primary" onClick={startCall} disabled={!canCall}>
            {starting ? "Iniciando…" : "Iniciar discagem (até 3 linhas)"}
          </Button>
          {pendingResultKind === "retry" ? (
            <Button onClick={retryNow}>Ligar novamente</Button>
          ) : null}
          <Button variant="bad" onClick={hangup} disabled={!canHangup}>
            Encerrar ligação
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <Tag>{queue.remaining} contatos na fila</Tag>
          <Tag variant={softphone.status === "in-call" ? "ok" : "default"}>
            {STATUS_LABEL[softphone.status]}
          </Tag>
        </div>
      </div>

      {softphone.error ? <p className="text-xs text-bad">{softphone.error}</p> : null}
      {queue.error ? <p className="text-xs text-bad">{queue.error}</p> : null}

      {dialingPersonIds.length > 0 ? (
        <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
          Discando {dialingPersonIds.length} linha{dialingPersonIds.length > 1 ? "s" : ""} em
          paralelo — a primeira pessoa que atender é conectada, as demais são encerradas
          automaticamente.
        </div>
      ) : null}

      {awaitingOutcome && currentPerson ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent bg-soft p-3.5">
          <div className="text-xs">
            Outcome pendente para <b>{currentPerson.name}</b> — a ligação encerrou e precisa
            ser classificada antes da próxima.
          </div>
          <Button variant="primary" size="small" onClick={openOutcomeModal}>
            Registrar outcome
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3.5 lg:grid-cols-[1.15fr_0.85fr]">
        <QueueTable
          queue={queue.queue}
          currentStatusLabel={currentStatusLabel}
          currentPersonId={currentPerson?.personId ?? null}
          dialingPersonIds={dialingPersonIds}
          onReorder={queue.moveItem}
        />
        <ResearchCard research={research.research} status={research.status} error={research.error} />
      </div>
    </div>
  );
}
