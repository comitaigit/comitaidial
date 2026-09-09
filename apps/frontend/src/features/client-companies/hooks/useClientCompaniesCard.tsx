"use client";

import { useEffect } from "react";
import { openModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useClientCompaniesStore } from "@/features/client-companies/stores/client-companies-store";
import { ClientCompanyForm } from "@/features/client-companies/components/ClientCompanyForm";
import {
  deleteClientCompany,
  type ClientCompany,
} from "@/features/client-companies/data/client-companies-api";

export function useClientCompaniesCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const { clientCompanies, status, error, fetchClientCompanies, removeClientCompany } =
    useClientCompaniesStore();

  useEffect(() => {
    if (accessToken) fetchClientCompanies(accessToken);
  }, [accessToken, fetchClientCompanies]);

  function openNewForm() {
    openModal(<ClientCompanyForm />, "Nova empresa/produto");
  }

  function openEditForm(company: ClientCompany) {
    openModal(<ClientCompanyForm existing={company} />, "Editar empresa/produto");
  }

  async function remove(company: ClientCompany) {
    if (!accessToken) return;
    try {
      await deleteClientCompany(company.id, accessToken);
      removeClientCompany(company.id);
      toast("Empresa/produto removida.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível remover.");
    }
  }

  return {
    clientCompanies,
    isLoading: status === "loading" || status === "idle",
    error,
    openNewForm,
    openEditForm,
    remove,
  };
}
