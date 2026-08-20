"use client";

import { useToast } from "@/features/shell/hooks/useToast";

export function useChangeListButton() {
  const toast = useToast();

  function changeList() {
    toast("Seletor de listas aberto (simulação).");
  }

  return { changeList };
}
