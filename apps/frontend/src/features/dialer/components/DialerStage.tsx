"use client";

import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { useDialerStage } from "@/features/dialer/hooks/useDialerStage";
import { OutcomePanel } from "@/features/dialer/components/OutcomePanel";
import type { SoftphoneStatus } from "@/features/dialer/hooks/useSoftphone";

const STATUS_LABEL: Record<SoftphoneStatus, string> = {
  idle: "Softphone desconectado",
  registering: "Conectando softphone…",
  ready: "Pronto para discar",
  connecting: "Discando…",
  "in-call": "Em ligação",
  error: "Erro no softphone",
};

export function DialerStage() {
  const {
    softphone,
    peopleStatus,
    currentPerson,
    contactsRemaining,
    activeCallId,
    lastDurationSeconds,
    awaitingOutcome,
    startCall,
    hangup,
    advanceToNext,
  } = useDialerStage();

  const canCall = softphone.status === "ready" && !!currentPerson?.phone && !awaitingOutcome;
  const canHangup = softphone.status === "connecting" || softphone.status === "in-call";

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHead>
          <CardTitle>Chamada</CardTitle>
          <Tag>{contactsRemaining} contatos restantes</Tag>
        </CardHead>
        <div className="p-4.5">
          <div className="p-5.5 text-center">
            <div className="mx-auto mb-3 grid h-18.5 w-18.5 place-items-center rounded-full border-2 border-dashed border-[#8d95a3] text-[22px] font-black">
              ☎
            </div>
            <h2 className="m-0 mb-1.5 text-lg">
              {currentPerson ? currentPerson.name : "Sem contatos para discar"}
            </h2>
            <p className="text-[13px] text-muted">
              {currentPerson
                ? `${currentPerson.account.name} · ${currentPerson.role ?? "—"}`
                : peopleStatus === "loading"
                  ? "Carregando prospects…"
                  : "Cadastre prospects com telefone para começar a discar."}
            </p>
          </div>

          <div className="my-4 rounded-[10px] border border-line bg-[#fafbfc] p-2.5 text-center">
            <span className="text-[10px] text-muted">Status do softphone</span>
            <strong className="mt-0.5 block text-xs">{STATUS_LABEL[softphone.status]}</strong>
            {softphone.error ? (
              <p className="mt-1 text-[11px] text-bad">{softphone.error}</p>
            ) : null}
          </div>

          <div className="flex justify-center gap-2">
            <Button variant="primary" onClick={startCall} disabled={!canCall}>
              Ligar
            </Button>
            <Button variant="bad" onClick={hangup} disabled={!canHangup}>
              Encerrar ligação
            </Button>
          </div>

          <div className="mt-4 rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
            Discagem paralela ainda não está disponível — cada tentativa liga um
            contato por vez pelo softphone do navegador. Toda tentativa cria um{" "}
            <b>Call</b> com outcome obrigatório antes de seguir para o próximo.
          </div>
        </div>
      </Card>

      <OutcomePanel
        person={currentPerson}
        callId={activeCallId}
        durationSeconds={lastDurationSeconds}
        active={awaitingOutcome}
        onOutcomeSaved={advanceToNext}
      />
    </div>
  );
}
