"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { EditCadenceCompanyForm } from "@/features/sequences/components/EditCadenceCompanyForm";
import type { Cadence } from "@/features/sequences/data/cadences-api";

export function useSequenceCard(sequence: Cadence) {
  function openCompanyForm() {
    openModal(<EditCadenceCompanyForm cadence={sequence} />, "Empresa/produto da cadência");
  }

  return { openCompanyForm };
}
