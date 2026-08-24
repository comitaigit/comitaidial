"use client";

import { useCallback, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { getResearch, type AccountResearch } from "@/features/dialer/data/dialer-api";

export function useResearchCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const [research, setResearch] = useState<AccountResearch | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (accountId: string, personRole: string | null) => {
      if (!accessToken) return;
      setStatus("loading");
      setError(null);
      try {
        const result = await getResearch(accountId, personRole, accessToken);
        setResearch(result);
        setStatus("loaded");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Não foi possível gerar a pesquisa.");
      }
    },
    [accessToken],
  );

  const clear = useCallback(() => {
    setResearch(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { research, status, error, load, clear };
}
