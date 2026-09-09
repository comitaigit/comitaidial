"use client";

import { useCallback, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { getResearch, DialerApiError, type AccountResearch } from "@/features/dialer/data/dialer-api";
import { refresh } from "@/features/auth/data/auth-api";

export function useResearchCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const setSession = useSessionStore((s) => s.setSession);
  const [research, setResearch] = useState<AccountResearch | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (accountId: string, personRole: string | null, clientCompanyId: string) => {
      if (!accessToken) return;
      setStatus("loading");
      setError(null);
      try {
        let token = accessToken;
        try {
          const result = await getResearch(accountId, personRole, clientCompanyId, token);
          setResearch(result);
          setStatus("loaded");
          return;
        } catch (err) {
          // On 401, refresh the access token and retry once
          if (err instanceof DialerApiError && err.status === 401) {
            const refreshed = await refresh();
            setSession(refreshed.user, refreshed.accessToken);
            token = refreshed.accessToken;
          } else {
            throw err;
          }
        }
        const result = await getResearch(accountId, personRole, clientCompanyId, token);
        setResearch(result);
        setStatus("loaded");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Não foi possível gerar a pesquisa.");
      }
    },
    [accessToken, setSession],
  );

  const clear = useCallback(() => {
    setResearch(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { research, status, error, load, clear };
}
