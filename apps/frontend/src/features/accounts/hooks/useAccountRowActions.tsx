"use client";

import { useState } from "react";
import { openModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { FindContactForm } from "@/features/accounts/components/FindContactForm";
import { enrichAccount, type Account } from "@/features/accounts/data/accounts-api";

export function useAccountRowActions() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function enrich(account: Account) {
    if (!accessToken || busyId) return;
    setBusyId(account.id);
    try {
      const result = await enrichAccount(account.id, accessToken);
      if (result.status === "SUCCESS") {
        toast(`Enriquecido: ${result.fieldsFilled.join(", ")}.`);
      } else if (result.status === "NO_MATCH") {
        toast("Nenhum dado novo encontrado.");
      } else {
        toast("O enriquecimento falhou.");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível enriquecer.");
    } finally {
      setBusyId(null);
    }
  }

  function openFindContact(account: Account) {
    openModal(<FindContactForm account={account} />, "Buscar contato");
  }

  return { busyId, enrich, openFindContact };
}
