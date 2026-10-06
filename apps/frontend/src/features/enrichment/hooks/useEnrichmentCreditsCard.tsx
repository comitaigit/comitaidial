"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useEnrichmentStore } from "@/features/enrichment/stores/enrichment-store";
import { grantEnrichmentCredits } from "@/features/enrichment/data/enrichment-api";

export function useEnrichmentCreditsCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useSessionStore((s) => s.user);
  const toast = useToast();
  const { balance, status, error, fetchBalance, setBalance } = useEnrichmentStore();
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (accessToken) fetchBalance(accessToken);
  }, [accessToken, fetchBalance]);

  async function grant(credits: number) {
    if (!accessToken || granting) return;
    setGranting(true);
    try {
      const result = await grantEnrichmentCredits(credits, accessToken);
      setBalance(result.balance);
      toast(`${credits} créditos adicionados.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível adicionar créditos.");
    } finally {
      setGranting(false);
    }
  }

  return {
    balance,
    isLoading: status === "loading" || status === "idle",
    error,
    isAdmin: user?.role === "ADMIN",
    granting,
    grant,
  };
}
