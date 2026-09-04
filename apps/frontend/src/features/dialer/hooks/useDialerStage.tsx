"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { openModal, closeModal } from "@/features/shell/stores/modal-store";
import { useSoftphone } from "@/features/dialer/hooks/useSoftphone";
import { useDialerQueue } from "@/features/dialer/hooks/useDialerQueue";
import { useResearchCard } from "@/features/dialer/hooks/useResearchCard";
import { useCadencePicker } from "@/features/dialer/hooks/useCadencePicker";
import { useCallTimer } from "@/features/dialer/hooks/useCallTimer";
import {
  startParallelBatch,
  getParallelBatchStatus,
  cancelParallelBatch,
  type ParallelBatchLeg,
  type ParallelBatchWinner,
  type ParallelLegStatus,
  type QueueItem,
} from "@/features/dialer/data/dialer-api";
import { ContactOutcomeModal } from "@/features/dialer/components/ContactOutcomeModal";
import type { OutcomeKind } from "@/features/dialer/hooks/useOutcomeForm";

export type DialerOutcomeId =
  | "meeting_booked"
  | "follow_up"
  | "voicemail"
  | "no_interest"
  | "wrong_contact"
  | "invalid_number";

// "Não atendeu / caixa postal / ocupado" hold the row for a short window
// offering "ligar novamente" before it moves to the back of the queue.
const RETRY_WINDOW_SECONDS = 2;

// Legs that lost the race but didn't get a real "no" — worth trying again
// later in the session, same rule the backend applies to CallOutcome.
const RETRY_ELIGIBLE_LEG_STATUSES = new Set<ParallelLegStatus>([
  "NO_ANSWER",
  "MACHINE_DETECTED",
  "BUSY",
  "ABANDONED",
]);

const BATCH_POLL_INTERVAL_MS = 1500;

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function useDialerStage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useSessionStore((s) => s.user);
  const cadencePicker = useCadencePicker();
  const softphone = useSoftphone();
  const queue = useDialerQueue(cadencePicker.selectedCadenceId);
  const research = useResearchCard();

  // Discagem paralela: up to 3 legs originated server-side per batch. The
  // browser never dials a number directly — it joins the batch's Conference
  // and waits for the poll below to report a winner (see
  // docs/discagem-paralela.md for the full backend flow).
  const [batchId, setBatchId] = useState<string | null>(null);
  const [legs, setLegs] = useState<ParallelBatchLeg[]>([]);
  const [legStatuses, setLegStatuses] = useState<Record<string, ParallelLegStatus>>({});
  const [winner, setWinner] = useState<ParallelBatchWinner | null>(null);
  const [batchPhase, setBatchPhase] = useState<"idle" | "dialing" | "connected">("idle");
  // Snapshot of the full QueueItem rows dialed in the current/last batch —
  // ParallelBatchWinner only carries the fields the research card needs, but
  // ContactOutcomeModal needs the full QueueItem shape (phone, persona,
  // priority...), so this is what openOutcomeModal looks the winner up in.
  const [dialedQueueItems, setDialedQueueItems] = useState<QueueItem[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dialingStartedAt, setDialingStartedAt] = useState<number | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);
  const [pendingResultKind, setPendingResultKind] = useState<"retry" | "invalid" | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session stats — tracked locally since there's no real-time stats endpoint yet
  const [sessionCallsMade, setSessionCallsMade] = useState(0);
  const [sessionConnections, setSessionConnections] = useState(0);

  // Outcome pre-selection in Estado 2 (visual — actual recording via modal)
  const [selectedOutcome, setSelectedOutcome] = useState<DialerOutcomeId | null>(null);

  const ringElapsedSeconds = useCallTimer(dialingStartedAt);
  const callElapsedSeconds = useCallTimer(connectedAt);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const resetBatch = useCallback(() => {
    clearPoll();
    setBatchId(null);
    setLegs([]);
    setLegStatuses({});
    setDialingStartedAt(null);
  }, [clearPoll]);

  // Losing legs are sorted into "worth retrying later" (goes to the back of
  // the queue) vs. a final no (dropped) — mirrors the single-line outcome
  // rule, just applied to up to 3 rows from one batch resolution at once.
  const settleLosingLegs = useCallback(
    (losing: Array<{ personId: string; status: ParallelLegStatus }>) => {
      const finalIds: string[] = [];
      for (const leg of losing) {
        if (RETRY_ELIGIBLE_LEG_STATUSES.has(leg.status)) {
          queue.requeuePersonId(leg.personId);
        } else {
          finalIds.push(leg.personId);
        }
      }
      if (finalIds.length) queue.removeByPersonIds(finalIds);
    },
    [queue],
  );

  const startBatchRef = useRef<() => void>(() => {});

  const pollBatch = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      try {
        const status = await getParallelBatchStatus(id, accessToken);
        setLegStatuses(Object.fromEntries(status.legs.map((l) => [l.callId, l.status])));

        if (status.winner) {
          clearPoll();
          setWinner(status.winner);
          setBatchPhase("connected");
          setActiveCallId(status.winner.callId);
          setDialingStartedAt(null);
          setConnectedAt(Date.now());
          setSessionConnections((n) => n + 1);
          settleLosingLegs(
            status.legs
              .filter((l) => l.callId !== status.winner!.callId)
              .map((l) => ({ personId: l.personId, status: l.status })),
          );
          return;
        }

        const allResolved = status.legs.every((l) => l.status !== "RINGING");
        if (allResolved) {
          clearPoll();
          settleLosingLegs(status.legs.map((l) => ({ personId: l.personId, status: l.status })));
          resetBatch();
          setBatchPhase("idle");
          // Nobody picked up on any of the 3 lines — the next contacts take
          // their place automatically, no BDR action needed.
          startBatchRef.current();
        }
      } catch {
        // best-effort poll — try again on the next tick
      }
    },
    [accessToken, clearPoll, resetBatch, settleLosingLegs],
  );

  const startBatch = useCallback(async () => {
    if (!accessToken || !cadencePicker.selectedCadenceId || softphone.status !== "ready") return;
    setBatchPhase("dialing");
    setDialingStartedAt(Date.now());
    setSelectedOutcome(null);
    setWinner(null);
    research.clear();
    try {
      const summary = await startParallelBatch(cadencePicker.selectedCadenceId, accessToken);
      if (summary.legs.length === 0) {
        setBatchPhase("idle");
        setDialingStartedAt(null);
        return;
      }
      setBatchId(summary.batchId);
      setLegs(summary.legs);
      setLegStatuses(
        Object.fromEntries(summary.legs.map((l) => [l.callId, "RINGING" as ParallelLegStatus])),
      );
      setDialedQueueItems(
        queue.queue.filter((item) => summary.legs.some((leg) => leg.personId === item.personId)),
      );
      setSessionCallsMade((n) => n + summary.legs.length);
      void softphone.callParallel(summary.batchId);
      pollRef.current = setInterval(() => void pollBatch(summary.batchId), BATCH_POLL_INTERVAL_MS);
    } catch {
      setBatchPhase("idle");
      setDialingStartedAt(null);
    }
  }, [accessToken, cadencePicker.selectedCadenceId, softphone, research, pollBatch, queue.queue]);

  useEffect(() => {
    startBatchRef.current = () => void startBatch();
  }, [startBatch]);

  // Research card loads once a real prospect answers — deep research is
  // always post-connection, never pre-dial.
  useEffect(() => {
    if (batchPhase === "connected" && winner) {
      void research.load(winner.accountId, winner.role, winner.clientCompanyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the connect transition
  }, [batchPhase]);

  const finishAttempt = useCallback(
    (kind: OutcomeKind) => {
      const personId = winner?.personId ?? null;
      setAwaitingOutcome(false);
      setActiveCallId(null);
      setBatchPhase("idle");
      setWinner(null);
      setConnectedAt(null);
      setSelectedOutcome(null);
      research.clear();
      closeModal();

      if (kind === "final") {
        if (personId) queue.removeByPersonIds([personId]);
        return;
      }

      // retry / invalid: hold the row for RETRY_WINDOW_SECONDS, then either
      // requeue it (retry) or drop it for good (invalid — número inexistente).
      setPendingResultKind(kind);
      setRetryCountdown(RETRY_WINDOW_SECONDS);
      countdownRef.current = setInterval(() => {
        setRetryCountdown((seconds) => {
          if (seconds === null || seconds <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            setPendingResultKind(null);
            if (personId) {
              if (kind === "retry") queue.requeuePersonId(personId);
              else queue.removeByPersonIds([personId]);
            }
            return null;
          }
          return seconds - 1;
        });
      }, 1000);
    },
    [queue, research, winner],
  );

  // Outcome modal opens automatically when the connected call ends. Also
  // exposed so the BDR can reopen it manually if they dismissed it without
  // registering.
  const openOutcomeModal = useCallback(() => {
    const person =
      dialedQueueItems.find((item) => item.personId === winner?.personId) ?? null;
    openModal(
      <ContactOutcomeModal
        person={person}
        callId={activeCallId}
        durationSeconds={softphone.lastDurationSeconds}
        onSaved={finishAttempt}
      />,
      "Registrar outcome",
    );
  }, [winner, dialedQueueItems, activeCallId, softphone.lastDurationSeconds, finishAttempt]);

  useEffect(() => {
    if (awaitingOutcome) openOutcomeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the awaitingOutcome transition
  }, [awaitingOutcome]);

  // The winner's browser leg disconnecting (BDR hangs up) is what ends a
  // connected call — same signal the single-line flow used, just no longer
  // gated on looking up the Call row afterwards since winner.callId is
  // already known from the batch poll.
  useEffect(() => {
    if (softphone.lastDurationSeconds === null || batchPhase !== "connected" || !activeCallId) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external SDK event (call disconnected), not deriving render state
    setAwaitingOutcome(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a new call actually ends
  }, [softphone.lastDurationSeconds]);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRetryCountdown(null);
    setPendingResultKind(null);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  const retryNow = useCallback(() => {
    clearCountdown();
    void startBatch();
  }, [clearCountdown, startBatch]);

  // "Pular contato" — sends the head of the queue to the back without
  // dialing. Only meaningful before a batch is in flight.
  const skipCurrent = useCallback(() => {
    if (!queue.currentPerson || batchPhase !== "idle") return;
    clearCountdown();
    queue.requeuePersonId(queue.currentPerson.personId);
  }, [queue, batchPhase, clearCountdown]);

  // BDR hangs up before any leg answered — cancels the still-ringing legs on
  // Twilio's side (not just the browser's own leg) so a leg that gets
  // answered a moment later doesn't create an empty room with the prospect
  // alone in it.
  const cancelCurrentBatch = useCallback(async () => {
    if (!accessToken || !batchId) return;
    clearPoll();
    const currentLegs = legs;
    try {
      await cancelParallelBatch(batchId, accessToken);
    } catch {
      // best-effort — Twilio-side legs still get cleaned up by their own
      // status callbacks even if this request fails
    }
    softphone.hangup();
    currentLegs.forEach((leg) => queue.requeuePersonId(leg.personId));
    resetBatch();
    setBatchPhase("idle");
  }, [accessToken, batchId, legs, clearPoll, softphone, queue, resetBatch]);

  const hangup = useCallback(() => {
    if (batchPhase === "dialing") {
      void cancelCurrentBatch();
      return;
    }
    softphone.hangup();
  }, [batchPhase, cancelCurrentBatch, softphone]);

  const selectOutcome = useCallback((outcome: DialerOutcomeId) => {
    setSelectedOutcome(outcome);
  }, []);

  const retryResearch = useCallback(() => {
    if (!winner) return;
    void research.load(winner.accountId, winner.role, winner.clientCompanyId);
  }, [winner, research]);

  // Fixed opener script — filled in with real data available the instant a
  // call connects, so it doesn't wait on the AI research call (and isn't
  // cached server-side, which would leak one BDR's name into another BDR's
  // call on the same account).
  const clientCompanyName = cadencePicker.selectedCadence?.clientCompany?.name ?? null;
  const suggestedScript =
    winner && user && clientCompanyName
      ? `${firstName(winner.name)}, aqui é ${firstName(user.name)} da ${clientCompanyName}. Em quarenta e cinco segundos eu posso explicar por que liguei e você pode me dizer se faz sentido ter uma discussão mais aprofundada. Tudo bem?`
      : null;

  return {
    softphone,
    cadencePicker,
    queue,
    research,
    winner,
    legs,
    legStatuses,
    batchPhase,
    activeCallId,
    lastDurationSeconds: softphone.lastDurationSeconds,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startBatch,
    retryNow,
    skipCurrent,
    hangup,
    cancelCurrentBatch,
    finishAttempt,
    openOutcomeModal,
    retryResearch,
    suggestedScript,
    ringElapsedSeconds,
    callElapsedSeconds,
    sessionCallsMade,
    sessionConnections,
    selectedOutcome,
    selectOutcome,
  };
}
