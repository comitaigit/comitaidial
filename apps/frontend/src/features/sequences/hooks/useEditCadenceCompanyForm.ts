"use client";

import { useEffect, useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useCadencesStore } from "@/features/sequences/stores/cadences-store";
import {
  listClientCompaniesForCadence,
  updateCadence,
  type Cadence,
  type ClientCompanyOption,
} from "@/features/sequences/data/cadences-api";

export function useEditCadenceCompanyForm(cadence: Cadence) {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const replaceCadence = useCadencesStore((s) => s.replaceCadence);

  const [clientCompanyId, setClientCompanyId] = useState(cadence.clientCompanyId ?? "");
  const [clientCompanies, setClientCompanies] = useState<ClientCompanyOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listClientCompaniesForCadence(accessToken)
      .then(setClientCompanies)
      .catch(() => setClientCompanies([]));
  }, [accessToken]);

  async function submit() {
    if (!accessToken || submitting) return;

    setSubmitting(true);
    try {
      const updated = await updateCadence(
        cadence.id,
        { clientCompanyId: clientCompanyId || null },
        accessToken,
      );
      replaceCadence(updated);
      toast("Empresa/produto da cadência atualizada.");
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return { clientCompanyId, setClientCompanyId, clientCompanies, submitting, submit };
}
