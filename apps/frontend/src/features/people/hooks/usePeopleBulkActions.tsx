"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { AddToCadenceForm } from "@/features/people/components/AddToCadenceForm";

export function usePeopleBulkActions(selectedIds: string[], onDone: () => void) {
  function openAddToCadenceModal() {
    openModal(
      <AddToCadenceForm personIds={selectedIds} onDone={onDone} />,
      "Adicionar à cadência",
    );
  }

  return { openAddToCadenceModal };
}
