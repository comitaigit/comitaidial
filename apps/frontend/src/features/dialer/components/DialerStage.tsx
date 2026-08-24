"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { QueueTable } from "@/features/dialer/components/QueueTable";
import { OutcomeForm } from "@/features/dialer/components/OutcomeForm";
import { ResearchCard } from "@/features/dialer/components/ResearchCard";
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
    queue,
    research,
    currentPerson,
    activeCallId,
    lastDurationSeconds,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startCall,
    retryNow,
    hangup,
    finishAttempt,
  } = useDialerStage();

  const currentStatusLabel =
    pendingResultKind === "retry"
      ? `Sem resposta · tentar de novo (${retryCountdown}s)`
      : pendingResultKind === "invalid"
        ? "Número inválido"
        : STATUS_LABEL[softphone.status];

  const canCall = softphone.status === "ready" && !!currentPerson && !awaitingOutcome;
  const canHangup = softphone.status === "connecting" || softphone.status === "in-call";

  return (
    <div className="grid gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line bg-panel p-3.5">
        <div className="flex items-center gap-2.5">
          <Button variant="primary" onClick={startCall} disabled={!canCall}>
            Iniciar discagem
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

      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Discagem paralela ainda não está disponível — a fila é trabalhada um
        contato por vez pelo softphone do navegador. Toda tentativa exige um
        outcome antes de seguir para o próximo.
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.15fr_0.85fr]">
        <QueueTable queue={queue.queue} currentStatusLabel={currentStatusLabel} />

        <div className="grid gap-3.5">
          <OutcomeForm
            person={currentPerson}
            callId={activeCallId}
            durationSeconds={lastDurationSeconds}
            active={awaitingOutcome}
            onSaved={finishAttempt}
          />
          <ResearchCard research={research.research} status={research.status} error={research.error} />
        </div>
      </div>
    </div>
  );
}
