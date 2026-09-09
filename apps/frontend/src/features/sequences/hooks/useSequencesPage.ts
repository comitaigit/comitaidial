"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useCadencesStore } from "@/features/sequences/stores/cadences-store";

export function useSequencesPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { cadences, status, error, fetchCadences } = useCadencesStore();

  useEffect(() => {
    if (accessToken) fetchCadences(accessToken);
  }, [accessToken, fetchCadences]);

  return { cadences, isLoading: status === "loading" || status === "idle", error };
}
