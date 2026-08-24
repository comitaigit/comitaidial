"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useSoftphone } from "@/features/dialer/hooks/useSoftphone";
import { useDialerQueue } from "@/features/dialer/hooks/useDialerQueue";
import { useResearchCard } from "@/features/dialer/hooks/useResearchCard";
import { getLatestCallForPerson } from "@/features/dialer/data/dialer-api";
import type { OutcomeKind } from "@/features/dialer/hooks/useOutcomeForm";

// "Não atendeu / caixa postal / ocupado" hold the row for a short window
// offering "ligar novamente" before it moves to the back of the queue —
// per the Dial spec.
const RETRY_WINDOW_SECONDS = 2;

export function useDialerStage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const softphone = useSoftphone();
  const queue = useDialerQueue();
  const research = useResearchCard();

  const [calledPersonId, setCalledPersonId] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);
  const [pendingResultKind, setPendingResultKind] = useState<"retry" | "invalid" | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPerson = queue.currentPerson;

  // Card de research só abre quando a chamada realmente conecta — pesquisa
  // profunda é sempre pós-conexão, nunca antes.
  useEffect(() => {
    if (softphone.status === "in-call" && currentPerson) {
      void research.load(currentPerson.accountId, currentPerson.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the connect transition
  }, [softphone.status]);

  // When a call ends, look up the Call the /calls/voice webhook already
  // persisted so the outcome form has something to PATCH.
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
    if (!currentPerson) return;
    clearCountdown();
    setCalledPersonId(currentPerson.personId);
    setActiveCallId(null);
    setAwaitingOutcome(false);
    research.clear();
    void softphone.call(currentPerson.phone, currentPerson.personId);
  }, [currentPerson, softphone, research, clearCountdown]);

  // "Ligar novamente" clicked inside the retry window.
  const retryNow = useCallback(() => {
    clearCountdown();
    startCall();
  }, [clearCountdown, startCall]);

  const finishAttempt = useCallback(
    (kind: OutcomeKind) => {
      setAwaitingOutcome(false);
      setActiveCallId(null);
      setCalledPersonId(null);
      research.clear();

      if (kind === "final") {
        queue.removeCurrentAndAdvance();
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
            if (kind === "retry") queue.requeueCurrent();
            else queue.removeCurrentAndAdvance();
            return null;
          }
          return seconds - 1;
        });
      }, 1000);
    },
    [queue, research],
  );

  return {
    softphone,
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
    hangup: softphone.hangup,
    finishAttempt,
  };
}
