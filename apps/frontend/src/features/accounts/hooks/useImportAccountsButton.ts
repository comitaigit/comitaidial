"use client";

import { useToast } from "@/features/shell/hooks/useToast";

export function useImportAccountsButton() {
  const toast = useToast();

  function importAccounts() {
    toast("Importação CSV simulada.");
  }

  return { importAccounts };
}
