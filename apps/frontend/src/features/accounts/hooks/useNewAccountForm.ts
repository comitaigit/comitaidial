"use client";

import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";

export function useNewAccountForm() {
  const toast = useToast();

  function create() {
    closeModal();
    toast("Account criada (simulação).");
  }

  return { create };
}
