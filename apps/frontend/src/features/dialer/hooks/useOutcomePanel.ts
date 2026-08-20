"use client";

import { useState } from "react";
import type { DialerBlockData } from "@/features/dialer/data/dialer";
import { useToast } from "@/features/shell/hooks/useToast";

export function useOutcomePanel(
  block: DialerBlockData,
  onOutcomeSaved: () => void
) {
  const [selected, setSelected] = useState<string | null>(null);
  const toast = useToast();

  function selectOutcome(id: string) {
    setSelected(id);
  }

  function saveOutcome() {
    if (!selected) return;
    const label = block.outcomes.find((o) => o.id === selected)?.label ?? selected;
    toast(`Outcome registrado: ${label}. Próxima tentativa iniciada.`);
    setSelected(null);
    onOutcomeSaved();
  }

  return { selected, selectOutcome, saveOutcome };
}
