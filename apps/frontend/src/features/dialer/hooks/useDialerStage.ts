"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useSoftphone } from "@/features/dialer/hooks/useSoftphone";
import {
  type CallablePerson,
  getLatestCallForPerson,
  listCallablePeople,
} from "@/features/dialer/data/dialer-api";

// Drives the single-call Dialer stage: loads the queue of callable
// prospects, owns which one is "current," and — once a call the softphone
// placed ends — looks up the Call the /calls/voice webhook already
// persisted so the outcome picker has something to PATCH.
export function useDialerStage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const softphone = useSoftphone();

  const [people, setPeople] = useState<CallablePerson[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<"loading" | "ready" | "error">("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [calledPersonId, setCalledPersonId] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listCallablePeople(accessToken)
      .then((all) => {
        if (cancelled) return;
        setPeople(all.filter((person) => person.phone));
        setPeopleStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setPeopleStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const currentPerson = people[currentIndex] ?? null;

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

  const startCall = useCallback(() => {
    if (!currentPerson?.phone) return;
    setCalledPersonId(currentPerson.id);
    setActiveCallId(null);
    setAwaitingOutcome(false);
    void softphone.call(currentPerson.phone, currentPerson.id);
  }, [currentPerson, softphone]);

  const advanceToNext = useCallback(() => {
    setAwaitingOutcome(false);
    setActiveCallId(null);
    setCalledPersonId(null);
    setCurrentIndex((index) => (index + 1 < people.length ? index + 1 : index));
  }, [people.length]);

  return {
    softphone,
    peopleStatus,
    currentPerson,
    contactsRemaining: Math.max(people.length - currentIndex, 0),
    activeCallId,
    lastDurationSeconds: softphone.lastDurationSeconds,
    awaitingOutcome,
    startCall,
    hangup: softphone.hangup,
    advanceToNext,
  };
}
