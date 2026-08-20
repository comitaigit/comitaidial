"use client";

import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";

export function useNewPersonForm() {
  const toast = useToast();

  function create() {
    closeModal();
    toast("Prospect criado e associado a uma Account.");
  }

  return { create };
}
