"use client";

import { useEffect, useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import {
  listClientCompanyOptions,
  findContact,
  type Account,
  type ClientCompanyOption,
} from "@/features/accounts/data/accounts-api";

export function useFindContactForm(account: Account) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [clientCompanies, setClientCompanies] = useState<ClientCompanyOption[]>([]);
  const [clientCompanyId, setClientCompanyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listClientCompanyOptions(accessToken).then(setClientCompanies).catch(() => {});
  }, [accessToken]);

  const canSubmit = !!clientCompanyId && !submitting;

  async function submit() {
    if (!accessToken || !canSubmit) return;
    setSubmitting(true);
    try {
      const result = await findContact(account.id, clientCompanyId, accessToken);
      if (result.status === "SUCCESS" && result.person) {
        toast(`Contato encontrado: ${result.person.name}.`);
      } else if (result.status === "ALREADY_EXISTS") {
        toast("Já existe um prospect com o cargo-alvo nesta conta.");
      } else if (result.status === "NO_MATCH") {
        toast("Nenhum contato encontrado para o ICP configurado.");
      } else {
        toast("A busca falhou — tente novamente mais tarde.");
      }
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível buscar o contato.");
    } finally {
      setSubmitting(false);
    }
  }

  return { clientCompanies, clientCompanyId, setClientCompanyId, submitting, canSubmit, submit };
}
