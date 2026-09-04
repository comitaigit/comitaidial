"use client";

import { CadencePicker } from "@/features/dialer/components/CadencePicker";
import { SessionBar } from "@/features/dialer/components/SessionBar";
import { ParallelDialCards } from "@/features/dialer/components/ParallelDialCards";
import { ContactQueue } from "@/features/dialer/components/ContactQueue";
import { ConnectedStatusBar } from "@/features/dialer/components/ConnectedStatusBar";
import { CallHero } from "@/features/dialer/components/CallHero";
import { OutcomeGrid } from "@/features/dialer/components/OutcomeGrid";
import { CallActions } from "@/features/dialer/components/CallActions";
import { OtherLinesPanel } from "@/features/dialer/components/OtherLinesPanel";
import { AIPanel } from "@/features/dialer/components/AIPanel";
import { useDialerStage } from "@/features/dialer/hooks/useDialerStage";

export function DialerStage() {
  const {
    softphone,
    cadencePicker,
    queue,
    research,
    winner,
    legs,
    legStatuses,
    batchPhase,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startBatch,
    retryNow,
    skipCurrent,
    hangup,
    cancelCurrentBatch,
    openOutcomeModal,
    ringElapsedSeconds,
    callElapsedSeconds,
    sessionCallsMade,
    sessionConnections,
    selectedOutcome,
    selectOutcome,
    retryResearch,
  } = useDialerStage();

  const connectionRate =
    sessionCallsMade > 0 ? Math.round((sessionConnections / sessionCallsMade) * 100) : 0;
  const progressPercent =
    sessionCallsMade > 0 ? Math.min(Math.round((sessionCallsMade / 80) * 100), 100) : 0;

  const isReady = softphone.status === "ready";
  const isDialing = batchPhase === "dialing";
  const isConnected = batchPhase === "connected" && !!winner;

  const canCall =
    isReady && !!queue.currentPerson && batchPhase === "idle" && !cadencePicker.isIncomplete;
  const canSkip = isReady && !!queue.currentPerson && batchPhase === "idle";

  // Estado 2: a real prospect answered — split-panel layout
  if (isConnected && winner) {
    return (
      <div className="-mx-4 sm:-mx-5.5 -mt-4 sm:-mt-5.5 flex min-h-[600px]">
        {/* Left panel — 460px fixed */}
        <div className="flex w-[460px] shrink-0 flex-col border-r border-[#F1F5F9]">
          <ConnectedStatusBar contactName={winner.name} />
          <CallHero
            name={winner.name}
            title={winner.role ?? ""}
            company={winner.accountName}
            elapsedSeconds={callElapsedSeconds}
          />
          <div className="h-px bg-[#F1F5F9]" />
          <OutcomeGrid selected={selectedOutcome} onSelect={selectOutcome} />
          <div className="h-px bg-[#F1F5F9]" />
          <CallActions onEnd={hangup} />
          <OtherLinesPanel lines={[]} />
        </div>

        {/* Right panel — flex:1 */}
        <div className="flex-1 overflow-hidden">
          <AIPanel
            research={research.research}
            status={research.status}
            error={research.error}
            onRetry={retryResearch}
            contact={{
              name: winner.name,
              company: winner.accountName,
              role: winner.role,
            }}
          />
        </div>
      </div>
    );
  }

  // Estado 1: ready / dialing / idle
  return (
    <div className="-mx-4 sm:-mx-5.5 -mt-4 sm:-mt-5.5 flex flex-col bg-white">
      <SessionBar
        callsMade={sessionCallsMade}
        callsGoal={80}
        connections={sessionConnections}
        connectionRate={connectionRate}
        conversations={0}
        conversationsGoal={15}
        progressPercent={progressPercent}
        onPause={() => {}}
      />

      <div className="flex flex-col gap-6 px-9 pb-10 pt-7">
        {/* Cadence picker — always visible so the cadence can be changed at any time */}
        <CadencePicker
          cadences={cadencePicker.cadences}
          isLoading={cadencePicker.isLoading}
          selectedCadenceId={cadencePicker.selectedCadenceId}
          onChange={cadencePicker.setSelectedCadenceId}
          isIncomplete={cadencePicker.isIncomplete}
        />

        {/* Errors */}
        {softphone.error && (
          <p className="text-[13px] text-[#DC2626]">{softphone.error}</p>
        )}
        {queue.error && (
          <p className="text-[13px] text-[#DC2626]">{queue.error}</p>
        )}

        {/* Heading */}
        <div>
          <h2 className="text-[18px] font-[600] tracking-[-0.3px] text-[#0F172A]">
            {isDialing
              ? `Discando agora · ${legs.length} ${legs.length === 1 ? "linha ativa" : "linhas ativas"}`
              : "Aguardando · Iniciar discagem"}
          </h2>
          {!isDialing && queue.currentPerson && (
            <p className="mt-0.5 text-[13px] text-[#94A3B8]">
              Próximo: {queue.currentPerson.name} · {queue.currentPerson.accountName}
            </p>
          )}
        </div>

        {/* Up to 3 parallel dial cards while a batch is in flight */}
        {isDialing ? (
          <div className="max-w-[720px]">
            <ParallelDialCards
              legs={legs}
              legStatuses={legStatuses}
              secondsRinging={ringElapsedSeconds}
              onCancel={cancelCurrentBatch}
            />
          </div>
        ) : (
          /* CTA buttons when ready */
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startBatch}
              disabled={!canCall}
              className="rounded-[8px] bg-[#0F172A] px-5 py-2.5 text-[14px] font-[700] text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Iniciar discagem
            </button>
            {pendingResultKind === "retry" && retryCountdown !== null && (
              <button
                onClick={retryNow}
                className="rounded-[8px] border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
              >
                Ligar novamente ({retryCountdown}s)
              </button>
            )}
            {canSkip && (
              <button
                onClick={skipCurrent}
                className="text-[13px] text-[#94A3B8] transition-colors hover:text-[#64748B]"
              >
                Pular contato
              </button>
            )}
          </div>
        )}

        {/* Outcome pending banner */}
        {awaitingOutcome && winner && (
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
            <p className="text-[13px] text-[#15803D]">
              Outcome pendente para{" "}
              <span className="font-[600]">{winner.name}</span> — classifique antes de
              avançar.
            </p>
            <button
              onClick={openOutcomeModal}
              className="shrink-0 rounded-[8px] bg-[#16A34A] px-3 py-1.5 text-[12px] font-[600] text-white transition-colors hover:bg-[#15803D]"
            >
              Registrar
            </button>
          </div>
        )}

        {/* Softphone status for non-ready states */}
        {softphone.status === "registering" && (
          <p className="text-[13px] text-[#94A3B8]">Conectando softphone…</p>
        )}
        {softphone.status === "idle" && (
          <p className="text-[13px] text-[#94A3B8]">Softphone desconectado.</p>
        )}
        {softphone.status === "error" && (
          <p className="text-[13px] text-[#DC2626]">Erro no softphone.</p>
        )}

        {/* Queue */}
        <ContactQueue
          contacts={isDialing ? queue.queue.slice(legs.length) : queue.queue}
          onRemove={(personId) => queue.removeByPersonIds([personId])}
        />
      </div>
    </div>
  );
}
