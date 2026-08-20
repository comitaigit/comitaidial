"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { NewSequenceForm } from "@/features/sequences/components/NewSequenceForm";

export function useNewSequenceButton() {
  function openNewSequenceModal() {
    openModal(<NewSequenceForm />, "Nova cadência");
  }

  return { openNewSequenceModal };
}
