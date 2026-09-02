"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { openModal, closeModal } from "@/features/shell/stores/modal-store";
import { useSoftphone } from "@/features/dialer/hooks/useSoftphone";
import { useDialerQueue } from "@/features/dialer/hooks/useDialerQueue";
import { useResearchCard } from "@/features/dialer/hooks/useResearchCard";
import { useCadencePicker } from "@/features/dialer/hooks/useCadencePicker";
import { useCallTimer } from "@/features/dialer/hooks/useCallTimer";
import { getLatestCallForPerson } from "@/features/dialer/data/dialer-api";
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

export function useDialerStage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const cadencePicker = useCadencePicker();
  const softphone = useSoftphone();
  const queue = useDialerQueue(cadencePicker.selectedCadenceId);
  const research = useResearchCard();

  const [calledPersonId, setCalledPersonId] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);
  const [pendingResultKind, setPendingResultKind] = useState<"retry" | "invalid" | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session stats — tracked locally since there's no real-time stats endpoint yet
  const [dialingStartedAt, setDialingStartedAt] = useState<number | null>(null);
  const [sessionCallsMade, setSessionCallsMade] = useState(0);
  const [sessionConnections, setSessionConnections] = useState(0);
  const prevStatusRef = useRef<typeof softphone.status>("idle");

  // Outcome pre-selection in Estado 2 (visual — actual recording via modal)
  const [selectedOutcome, setSelectedOutcome] = useState<DialerOutcomeId | null>(null);

  // Ringing timer (Estado 1 DialCard) and connected call timer (Estado 2 CallHero)
  const ringElapsedSeconds = useCallTimer(dialingStartedAt);
  const callElapsedSeconds = useCallTimer(softphone.callStartedAt);

  const currentPerson = queue.currentPerson;

  // Count connections when status transitions from connecting → in-call
  useEffect(() => {
    if (softphone.status === "in-call" && prevStatusRef.current === "connecting") {
      setSessionConnections((n) => n + 1);
    }
    prevStatusRef.current = softphone.status;
  }, [softphone.status]);

  // Research card loads when the call connects — deep research is always
  // post-connection, never pre-dial.
  useEffect(() => {
    if (softphone.status === "in-call" && currentPerson) {
      void research.load(currentPerson.accountId, currentPerson.role, currentPerson.clientCompanyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the connect transition
  }, [softphone.status]);

  // When a call ends, fetch the Call record the /calls/voice webhook already
  // persisted so the outcome modal has a callId to PATCH.
  useEffect(() => {
    if (softphone.lastDurationSeconds === null || !calledPersonId || !accessToken) return;
    let cancelled = false;
    getLatestCallForPerson(calledPersonId, accessToken).then((call) => {
      if (cancelled || !call) return;
      setActiveCallId(call.id);
      setAwaitingOutcome(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a new call actually ends
  }, [softphone.lastDurationSeconds]);

  const finishAttempt = useCallback(
    (kind: OutcomeKind) => {
      const personId = calledPersonId;
      setAwaitingOutcome(false);
      setActiveCallId(null);
      setCalledPersonId(null);
      setDialingStartedAt(null);
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
    [queue, research, calledPersonId],
  );

  // Outcome modal opens automatically when a call ends. Also exposed so the
  // BDR can reopen it manually if they dismissed it without registering.
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

  const startCall = useCallback(() => {
    if (!currentPerson || softphone.status !== "ready") return;
    clearCountdown();
    setCalledPersonId(currentPerson.personId);
    setActiveCallId(null);
    setAwaitingOutcome(false);
    setDialingStartedAt(Date.now());
    setSessionCallsMade((n) => n + 1);
    setSelectedOutcome(null);
    research.clear();
    void softphone.call(currentPerson.phone, currentPerson.personId);
  }, [currentPerson, softphone, research, clearCountdown]);

  const retryNow = useCallback(() => {
    clearCountdown();
    startCall();
  }, [clearCountdown, startCall]);

  // "Pular contato" — sends to the back of the queue without dialing.
  const skipCurrent = useCallback(() => {
    if (!currentPerson) return;
    clearCountdown();
    queue.requeuePersonId(currentPerson.personId);
  }, [currentPerson, queue, clearCountdown]);

  const selectOutcome = useCallback((outcome: DialerOutcomeId) => {
    setSelectedOutcome(outcome);
  }, []);

  return {
    softphone,
    cadencePicker,
    queue,
    research,
    currentPerson,
    activeCallId,
    lastDurationSeconds: softphone.lastDurationSeconds,
    awaitingOutcome,
    pendingResultKind,
    retryCountdown,
    startCall,
    retryNow,
    skipCurrent,
    hangup: softphone.hangup,
    finishAttempt,
    openOutcomeModal,
    ringElapsedSeconds,
    callElapsedSeconds,
    sessionCallsMade,
    sessionConnections,
    selectedOutcome,
    selectOutcome,
  };
}
