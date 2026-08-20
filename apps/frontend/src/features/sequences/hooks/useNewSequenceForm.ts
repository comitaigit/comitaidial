"use client";

import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";

export function useNewSequenceForm() {
  const toast = useToast();

  function create() {
    closeModal();
    toast("Cadência criada (simulação).");
  }

  return { create };
}
