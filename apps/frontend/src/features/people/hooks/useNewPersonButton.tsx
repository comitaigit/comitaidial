"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { NewPersonForm } from "@/features/people/components/NewPersonForm";

export function useNewPersonButton() {
  function openNewPersonModal() {
    openModal(<NewPersonForm />, "Novo prospect");
  }

  return { openNewPersonModal };
}
