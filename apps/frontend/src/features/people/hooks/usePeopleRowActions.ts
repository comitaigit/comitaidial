"use client";

import { useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { enrichPerson, type Person } from "@/features/people/data/people-api";

export function usePeopleRowActions() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function enrich(person: Person) {
    if (!accessToken || busyId) return;
    setBusyId(person.id);
    try {
      const result = await enrichPerson(person.id, accessToken);
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

  return { busyId, enrich };
}
