"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { ImportAccountsForm } from "@/features/accounts/components/ImportAccountsForm";

export function useImportAccountsButton() {
  function openImportModal() {
    openModal(<ImportAccountsForm />, "Importar accounts via CSV");
  }

  return { openImportModal };
}
