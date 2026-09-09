"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { ImportPeopleForm } from "@/features/people/components/ImportPeopleForm";

export function useImportPeopleButton() {
  function openImportModal() {
    openModal(<ImportPeopleForm />, "Importar prospects via CSV");
  }

  return { openImportModal };
}
