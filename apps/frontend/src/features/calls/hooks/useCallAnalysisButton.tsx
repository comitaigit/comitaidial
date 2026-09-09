"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { CallAnalysisModal } from "@/features/calls/components/CallAnalysisModal";
import type { Call } from "@/features/calls/data/calls-api";

export function useCallAnalysisButton(call: Call) {
  function openAnalysisModal() {
    openModal(<CallAnalysisModal call={call} />, "Análise da ligação");
  }

  return { openAnalysisModal };
}
