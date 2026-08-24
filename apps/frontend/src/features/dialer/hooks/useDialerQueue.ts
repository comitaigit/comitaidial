"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { getQueue, type QueueItem } from "@/features/dialer/data/dialer-api";

// The queue is always worked from the front — queue[0] is "current". No
// separate index: removing/requeuing the front row is enough to advance,
// and avoids a second piece of state that could drift from the array.
export function useDialerQueue() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const items = await getQueue(accessToken as string);
        if (cancelled) return;
        setQueue(items);
        setStatus("loaded");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Não foi possível carregar a fila.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Definitive outcome (or número inexistente) — the contact is done, drop it.
  const removeCurrentAndAdvance = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  // Retry-eligible outcome (não atendeu / caixa postal / ocupado) — send it
  // to the back of the queue instead of dropping it.
  const requeueCurrent = useCallback(() => {
    setQueue((prev) => (prev.length > 0 ? [...prev.slice(1), prev[0]] : prev));
  }, []);

  return {
    queue,
    status,
    error,
    currentPerson: queue[0] ?? null,
    remaining: queue.length,
    removeCurrentAndAdvance,
    requeueCurrent,
  };
}
