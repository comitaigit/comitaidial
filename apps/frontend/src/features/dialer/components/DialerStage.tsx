"use client";

import { CadencePicker } from "@/features/dialer/components/CadencePicker";
import { SessionBar } from "@/features/dialer/components/SessionBar";
import { DialCard } from "@/features/dialer/components/DialCard";
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
    currentPerson,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startCall,
    retryNow,
    skipCurrent,
    hangup,
    openOutcomeModal,
    ringElapsedSeconds,
    callElapsedSeconds,
    sessionCallsMade,
    sessionConnections,
    selectedOutcome,
    selectOutcome,
  } = useDialerStage();

  const connectionRate =
    sessionCallsMade > 0 ? Math.round((sessionConnections / sessionCallsMade) * 100) : 0;
  const progressPercent =
    sessionCallsMade > 0 ? Math.min(Math.round((sessionCallsMade / 80) * 100), 100) : 0;

  const isConnected = softphone.status === "in-call";
  const isDialing = softphone.status === "connecting";
  const isReady = softphone.status === "ready";

  const canCall =
    isReady && !!currentPerson && !awaitingOutcome && !cadencePicker.isIncomplete;
  const canSkip = isReady && !!currentPerson && !awaitingOutcome;

  // Estado 2: call is active — split-panel layout
  if (isConnected && currentPerson) {
    return (
      <div className="-mx-4 sm:-mx-5.5 -mt-4 sm:-mt-5.5 flex min-h-[600px]">
        {/* Left panel — 460px fixed */}
        <div className="flex w-[460px] shrink-0 flex-col border-r border-[#F1F5F9]">
          <ConnectedStatusBar contactName={currentPerson.name} />
          <CallHero
            name={currentPerson.name}
            title={currentPerson.role ?? ""}
            company={currentPerson.accountName}
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
            contact={{
              name: currentPerson.name,
              company: currentPerson.accountName,
              role: currentPerson.role,
            }}
          />
        </div>
      </div>
    );
  }

  // Estado 1: ready / connecting / idle
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
        {/* Cadence picker — only shown until a cadence is selected */}
        {cadencePicker.isIncomplete && (
          <CadencePicker
            cadences={cadencePicker.cadences}
            isLoading={cadencePicker.isLoading}
            selectedCadenceId={cadencePicker.selectedCadenceId}
            onChange={cadencePicker.setSelectedCadenceId}
            isIncomplete={cadencePicker.isIncomplete}
          />
        )}

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
            {isDialing ? "Discando agora · 1 linha ativa" : "Aguardando · Iniciar discagem"}
          </h2>
          {!isDialing && currentPerson && (
            <p className="mt-0.5 text-[13px] text-[#94A3B8]">
              Próximo: {currentPerson.name} · {currentPerson.accountName}
            </p>
          )}
        </div>

        {/* Active dial card when connecting */}
        {isDialing && currentPerson ? (
          <div className="max-w-[280px]">
            <DialCard
              contactName={currentPerson.name}
              title={currentPerson.role ?? ""}
              company={currentPerson.accountName}
              secondsRinging={ringElapsedSeconds}
              onSkip={skipCurrent}
            />
          </div>
        ) : (
          /* CTA buttons when ready */
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startCall}
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
        {awaitingOutcome && currentPerson && (
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
            <p className="text-[13px] text-[#15803D]">
              Outcome pendente para{" "}
              <span className="font-[600]">{currentPerson.name}</span> — classifique antes de
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
          contacts={isDialing ? queue.queue.slice(1) : queue.queue}
          onRemove={(personId) => queue.removeByPersonIds([personId])}
        />
      </div>
    </div>
  );
}
