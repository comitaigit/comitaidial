"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Call, Device } from "@twilio/voice-sdk";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { getVoiceToken } from "@/features/dialer/data/dialer-api";

export type SoftphoneStatus =
  | "idle"
  | "registering"
  | "ready"
  | "connecting"
  | "in-call"
  | "error";

// Owns the Twilio.Device lifecycle: registers a softphone identity on
// mount using a token from POST /calls/voice-token, and exposes call()/
// hangup() wired to that Device. One Device per browser tab.
export function useSoftphone() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callStartedAtRef = useRef<number | null>(null);

  const [status, setStatus] = useState<SoftphoneStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [lastDurationSeconds, setLastDurationSeconds] = useState<number | null>(null);
  // Distinct from lastDurationSeconds, which can legitimately be (and stay)
  // null for an attempt that never connected — a plain null->null update
  // doesn't re-render, so the dialer stage's "an attempt just ended, go
  // collect its outcome" effect needs a value that always changes on every
  // disconnect/cancel, answered or not.
  const [attemptEndedAt, setAttemptEndedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function register() {
      setStatus("registering");
      try {
        const { token } = await getVoiceToken(accessToken as string);
        if (cancelled) return;

        const device = new Device(token, { logLevel: "error" });
        device.on("registered", () => setStatus("ready"));
        device.on("unregistered", () => setStatus("idle"));
        device.on("error", (twilioError) => {
          setError(twilioError.message);
          setStatus("error");
        });
        device.register();
        deviceRef.current = device;
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Não foi possível iniciar o softphone.",
        );
        setStatus("error");
      }
    }

    void register();

    return () => {
      cancelled = true;
      deviceRef.current?.destroy();
      deviceRef.current = null;
    };
  }, [accessToken]);

  const call = useCallback(
    async (to: string, personId: string) => {
      const device = deviceRef.current;
      if (!device || status !== "ready") return;

      setError(null);
      setLastDurationSeconds(null);
      setStatus("connecting");

      const activeCall = await device.connect({ params: { To: to, personId } });
      activeCallRef.current = activeCall;

      activeCall.on("accept", () => {
        callStartedAtRef.current = Date.now();
        setStatus("in-call");
        setCallStartedAt(Date.now());
      });
      activeCall.on("disconnect", () => {
        const startedAt = callStartedAtRef.current;
        setLastDurationSeconds(
          startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
        );
        setAttemptEndedAt(Date.now());
        callStartedAtRef.current = null;
        setStatus("ready");
        setCallStartedAt(null);
        activeCallRef.current = null;
      });
      activeCall.on("cancel", () => {
        setLastDurationSeconds(null);
        setAttemptEndedAt(Date.now());
        callStartedAtRef.current = null;
        setStatus("ready");
        setCallStartedAt(null);
        activeCallRef.current = null;
      });
      activeCall.on("error", (callError) => {
        setError(callError.message);
        setLastDurationSeconds(null);
        setAttemptEndedAt(Date.now());
        callStartedAtRef.current = null;
        setStatus("ready");
        setCallStartedAt(null);
        activeCallRef.current = null;
      });
    },
    [status],
  );

  const hangup = useCallback(() => {
    activeCallRef.current?.disconnect();
  }, []);

  return { status, error, callStartedAt, lastDurationSeconds, attemptEndedAt, call, hangup };
}
