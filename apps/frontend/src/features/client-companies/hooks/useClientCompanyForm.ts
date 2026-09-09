"use client";

import { useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useClientCompaniesStore } from "@/features/client-companies/stores/client-companies-store";
import {
  createClientCompany,
  updateClientCompany,
  type ClientCompany,
} from "@/features/client-companies/data/client-companies-api";

export function useClientCompanyForm(existing?: ClientCompany) {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const addClientCompany = useClientCompaniesStore((s) => s.addClientCompany);
  const replaceClientCompany = useClientCompaniesStore((s) => s.replaceClientCompany);

  const [name, setName] = useState(existing?.name ?? "");
  const [mainProduct, setMainProduct] = useState(existing?.mainProduct ?? "");
  const [positioning, setPositioning] = useState(existing?.positioning ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!accessToken || submitting) return;
    if (!name.trim() || !mainProduct.trim()) return;

    setSubmitting(true);
    try {
      const input = {
        name: name.trim(),
        mainProduct: mainProduct.trim(),
        positioning: positioning.trim() || undefined,
      };

      if (existing) {
        const updated = await updateClientCompany(existing.id, input, accessToken);
        replaceClientCompany(updated);
        toast("Empresa/produto atualizada.");
      } else {
        const created = await createClientCompany(input, accessToken);
        addClientCompany(created);
        toast("Empresa/produto cadastrada.");
      }
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    name,
    setName,
    mainProduct,
    setMainProduct,
    positioning,
    setPositioning,
    submitting,
    canSubmit: name.trim().length > 0 && mainProduct.trim().length > 0 && !submitting,
    submit,
  };
}
