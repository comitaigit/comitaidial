"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { getQueue, reorderQueue, type QueueItem } from "@/features/dialer/data/dialer-api";

// The queue is always worked from the front — queue[0] is "current". No
// separate index: removing/requeuing the front row is enough to advance,
// and avoids a second piece of state that could drift from the array.
// cadenceId is null until the BDR picks which cadence to work — the queue
// stays empty until then (no more tenant-wide fila).
export function useDialerQueue(cadenceId: string | null) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !cadenceId) return;
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const items = await getQueue(cadenceId as string, accessToken as string);
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
  }, [accessToken, cadenceId]);

  // Definitive outcome (or número inexistente) — the contact is done, drop it.
  const removeCurrentAndAdvance = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  // Retry-eligible outcome (não atendeu / caixa postal / ocupado) — send it
  // to the back of the queue instead of dropping it.
  const requeueCurrent = useCallback(() => {
    setQueue((prev) => (prev.length > 0 ? [...prev.slice(1), prev[0]] : prev));
  }, []);

  // Manual drag-and-drop reorder — same "whole new order is authoritative"
  // contract as reordering a playlist. Index 0 (the row currently being
  // worked) is never a valid source or target: only the "Pendente" rows
  // behind it can be rearranged. Applies the new order immediately for a
  // responsive drag, then persists it; a failed persist just gets a toast
  // (the local order stands — worst case it's re-fetched as priority order
  // on the next queue load, not silently wrong).
  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 1 || toIndex < 1) return;
      setQueue((prev) => {
        if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);

        if (cadenceId && accessToken) {
          const personIds = next.map((item) => item.personId);
          reorderQueue(cadenceId, personIds, accessToken).catch(() => {
            toast("Não foi possível salvar a nova ordem da fila.");
          });
        }

        return next;
      });
    },
    [cadenceId, accessToken, toast],
  );

  // No cadenceId selected — always render as empty/idle regardless of
  // whatever a previously-selected cadence's fetch left behind, without
  // needing an effect-driven reset.
  const effectiveQueue = cadenceId ? queue : [];

  return {
    queue: effectiveQueue,
    status: cadenceId ? status : "idle",
    error: cadenceId ? error : null,
    currentPerson: effectiveQueue[0] ?? null,
    remaining: effectiveQueue.length,
    removeCurrentAndAdvance,
    requeueCurrent,
    moveItem,
  };
}
