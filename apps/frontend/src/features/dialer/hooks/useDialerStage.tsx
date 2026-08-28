"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { openModal, closeModal } from "@/features/shell/stores/modal-store";
import { useSoftphone } from "@/features/dialer/hooks/useSoftphone";
import { useDialerQueue } from "@/features/dialer/hooks/useDialerQueue";
import { useResearchCard } from "@/features/dialer/hooks/useResearchCard";
import { useCadencePicker } from "@/features/dialer/hooks/useCadencePicker";
import {
  startParallelBatch,
  cancelParallelBatch,
  getParallelBatchStatus,
  type ParallelBatchSummary,
  type ParallelBatchStatus,
} from "@/features/dialer/data/dialer-api";
import { ContactOutcomeModal } from "@/features/dialer/components/ContactOutcomeModal";
import type { OutcomeKind } from "@/features/dialer/hooks/useOutcomeForm";

// "Não atendeu / caixa postal / ocupado" hold the row for a short window
// offering "ligar novamente" before it moves to the back of the queue —
// per the Dial spec.
const RETRY_WINDOW_SECONDS = 2;

// Discagem paralela — up to 3 lines at once (2026-08-25). Polls the batch
// while it's in flight; no push/websocket in v1.
const BATCH_POLL_MS = 1500;

export function useDialerStage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const cadencePicker = useCadencePicker();
  const queue = useDialerQueue(cadencePicker.selectedCadenceId);
  const research = useResearchCard();

  const [starting, setStarting] = useState(false);
  const [batch, setBatch] = useState<ParallelBatchSummary | null>(null);
  const [batchStatus, setBatchStatus] = useState<ParallelBatchStatus | null>(null);
  const [pendingResultKind, setPendingResultKind] = useState<"retry" | "invalid" | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const winner = batchStatus?.winner ?? null;
  // Looked up by personId rather than assumed to be queue[0]: the batch's
  // candidates are picked from a fresh server-side queue snapshot, which
  // can drift from this tab's cached local order (a manual reorder from
  // another tab, a priority change) — pruning the other legs by id keeps
  // them out of the list either way, but only an id lookup guarantees the
  // winner (not just "whoever's now in front") is who the outcome gets
  // attributed to.
  // While a batch is actively dialing with no winner yet, there is no
  // single "current" contact — up to 3 people are being tried at once, and
  // none of them is connected. Falling back to queue.currentPerson (the
  // front of the local queue) here was the bug behind the row that showed
  // "Em ligação" the instant the browser joined the Conference: that status
  // comes from softphone.status, which flips to "in-call" the moment the
  // BDR's own leg joins the room — not when any prospect answers — so it
  // was labeling an arbitrary front-of-queue contact as connected while
  // the real 3 dialed legs (correctly tracked in dialingPersonIds) sat
  // right below it unlabeled.
  const currentPerson = winner
    ? (queue.queue.find((item) => item.personId === winner.personId) ?? queue.currentPerson)
    : batch
      ? null
      : queue.currentPerson;
  const dialingPersonIds = batch && !winner
    ? batch.legs.map((leg) => leg.personId)
    : [];
  // Derived rather than stored: the winner's callId (once known) *is*
  // activeCallId — storing it as its own state would just be an
  // effect-driven copy of this.
  const activeCallId = winner?.callId ?? null;

  // Read via refs so handleAttemptEnded (passed once into useSoftphone,
  // invoked from its SDK event handlers) always sees the latest values
  // without needing to be redefined — and without useSoftphone needing to
  // re-wire its Twilio Call listeners — every time they change.
  const batchRef = useRef(batch);
  useEffect(() => {
    batchRef.current = batch;
  }, [batch]);
  const activeCallIdRef = useRef(activeCallId);
  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);
  // Set right before tick() itself triggers the hangup for an already-
  // resolved batch (see the allTerminal branch below) — lets
  // handleAttemptEnded tell "the BDR hit Encerrar before any line
  // resolved" apart from "the system hung up after the batch was already
  // fully handled", which fire through the exact same softphone disconnect
  // event and are otherwise indistinguishable from inside the handler.
  const batchEndedBySystemRef = useRef(false);

  // An attempt ends when the BDR's browser leg disconnects. If there was a
  // winner, awaitingOutcome below flips true on its own (derived from
  // softphone.status + activeCallId) — nothing to do here. Otherwise the
  // BDR gave up before anyone answered: cancel whatever's still ringing so
  // a prospect who picks up isn't dropped into an empty conference room,
  // and — only when this was the BDR's own choice, not the system already
  // wrapping up a resolved batch — treat those contacts the same as a
  // natural "não atendeu": the backend now records NO_ANSWER for them
  // (cancelBatch), so requeue them locally to match, instead of leaving
  // them sitting unclassified at the front of the queue.
  // This runs as a genuine external-event callback (from the Twilio SDK's
  // own disconnect/cancel/error handlers inside useSoftphone), not a React
  // effect watching derived state, so it's fine to setState here directly.
  const handleAttemptEnded = useCallback(() => {
    if (activeCallIdRef.current) return;
    const endedBatch = batchRef.current;
    const endedBySystem = batchEndedBySystemRef.current;
    batchEndedBySystemRef.current = false;
    if (endedBatch && accessToken) {
      cancelParallelBatch(endedBatch.batchId, accessToken).catch(() => {
        // best-effort — the legs will still resolve on their own via AMD/status callbacks
      });
      if (!endedBySystem) {
        for (const leg of endedBatch.legs) {
          queue.requeuePersonId(leg.personId);
        }
      }
    }
    setBatch(null);
    setBatchStatus(null);
    research.clear();
  }, [accessToken, research, queue]);

  const softphone = useSoftphone(handleAttemptEnded);
  // "Awaiting outcome" *is* "the browser leg is idle again while we still
  // have a winner from the batch that just ended" — also derived, not
  // stored.
  const awaitingOutcome = softphone.status === "ready" && activeCallId !== null;

  // Poll GET /calls/parallel-batch/:id while a batch is open. The winner/
  // all-terminal handling lives inside tick() itself (a callback, not the
  // effect body) so the resulting setState calls happen in response to the
  // fetch resolving — not synchronously inside the effect — and tick()
  // self-stops the interval the moment the batch resolves, so a poll that's
  // already in flight can't re-apply the same resolution twice.
  useEffect(() => {
    if (!batch || !accessToken) return;
    const batchId = batch.batchId;
    const token = accessToken;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      try {
        const status = await getParallelBatchStatus(batchId, token);
        if (cancelled) return;
        setBatchStatus(status);

        // Losing legs are never pruned from the local queue here: today,
        // the backend only ever deactivates a CadenceEnrollment inside
        // updateOutcome — the route the outcome modal PATCHes, reachable
        // only for the winner's call. handleParallelLegAmd/
        // handleParallelLegStatus (which resolve every losing leg —
        // MACHINE_DETECTED, NO_ANSWER, BUSY, FAILED, ABANDONED) only ever
        // update the `calls` row, never CadenceEnrollment.active — so
        // every one of those contacts is still genuinely enrolled and
        // re-dialable, and the next getQueue() will offer them again
        // regardless of what we do locally. Removing them here (as every
        // earlier version of this logic did, even when narrowed to just
        // FAILED) desyncs the local queue from that reality: the backend
        // re-selects them next round, but their row no longer exists
        // locally for dialingPersonIds to match, so only genuinely-new
        // candidates ever show "Discando". The only local removal that
        // stays correct is the winner's, once a real outcome is PATCHed
        // (see finishAttempt) — that's the one case that actually changes
        // CadenceEnrollment.active server-side today.
        const resolvedWinner = status.winner;
        if (resolvedWinner) {
          if (intervalId) clearInterval(intervalId);
          void research.load(
            resolvedWinner.accountId,
            resolvedWinner.role,
            resolvedWinner.clientCompanyId,
          );
          return;
        }

        const allTerminal = status.legs.every((leg) => leg.status !== "RINGING");
        if (allTerminal) {
          if (intervalId) clearInterval(intervalId);
          toast("Nenhuma das linhas foi atendida por uma pessoa.");
          // The BDR's own leg is still sitting in the batch's Conference
          // room — nothing else disconnects it when no line is answered,
          // so without this the softphone stays stuck on "in-call" and the
          // next "Iniciar discagem" silently no-ops (Device.connect only
          // proceeds from "ready"). This lets its own "disconnect" handler
          // reset status naturally.
          batchEndedBySystemRef.current = true;
          softphone.hangup();
          setBatch(null);
          setBatchStatus(null);
        }
      } catch {
        // transient poll failure — try again on the next tick
      }
    }

    void tick();
    intervalId = setInterval(() => void tick(), BATCH_POLL_MS);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-poll only when a new batch actually starts
  }, [batch?.batchId, accessToken]);

  const finishAttempt = useCallback(
    (kind: OutcomeKind) => {
      const personId = currentPerson?.personId ?? null;
      setBatch(null);
      setBatchStatus(null);
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
    [queue, research, currentPerson],
  );

  // Popup para cadastro do outcome, não um card fixo na tela — abre sozinho
  // assim que uma tentativa exige classificação. Exposta também como
  // openOutcomeModal para reabrir manualmente caso o BDR feche o popup sem
  // registrar (toda tentativa exige um outcome antes de seguir).
  const openOutcomeModal = useCallback(() => {
    openModal(
      <ContactOutcomeModal
        person={currentPerson}
        callId={activeCallId}
        durationSeconds={softphone.lastDurationSeconds}
        onSaved={finishAttempt}
      />,
      "Registrar outcome",
    );
  }, [currentPerson, activeCallId, softphone.lastDurationSeconds, finishAttempt]);

  useEffect(() => {
    if (awaitingOutcome) openOutcomeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the awaitingOutcome transition
  }, [awaitingOutcome]);

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
    };
  }, []);

  // "Iniciar discagem" now always starts a parallel batch (up to 3 lines,
  // fixed in v1) — the browser joins the batch's Conference room, and
  // whichever line a human answers first gets bridged in.
  const startCall = useCallback(async () => {
    if (!cadencePicker.selectedCadenceId || !accessToken || starting) return;
    clearCountdown();
    research.clear();
    setStarting(true);
    try {
      const summary = await startParallelBatch(cadencePicker.selectedCadenceId, accessToken);
      if (summary.legs.length === 0) {
        toast("Fila vazia — nenhum contato disponível para discar.");
        return;
      }
      setBatch(summary);
      setBatchStatus(null);
      await softphone.callParallel(summary.batchId);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível iniciar a discagem.");
    } finally {
      setStarting(false);
    }
  }, [cadencePicker.selectedCadenceId, accessToken, starting, clearCountdown, research, softphone, toast]);

  // "Ligar novamente" clicked inside the retry window — the contact is
  // still at the front of the queue, so a fresh batch picks it right back up.
  const retryNow = useCallback(() => {
    clearCountdown();
    void startCall();
  }, [clearCountdown, startCall]);

  return {
    softphone,
    cadencePicker,
    queue,
    research,
    currentPerson,
    activeCallId,
    winner,
    starting,
    dialingPersonIds,
    lastDurationSeconds: softphone.lastDurationSeconds,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startCall,
    retryNow,
    hangup: softphone.hangup,
    finishAttempt,
    openOutcomeModal,
  };
}
