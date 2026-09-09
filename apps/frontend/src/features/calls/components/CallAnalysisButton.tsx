"use client";

import { Button } from "@/components/ui/Button";
import { useCallAnalysisButton } from "@/features/calls/hooks/useCallAnalysisButton";
import type { Call } from "@/features/calls/data/calls-api";

export function CallAnalysisButton({ call }: { call: Call }) {
  const { openAnalysisModal } = useCallAnalysisButton(call);
  const hasSomethingToShow = Boolean(call.recordingUrl);

  return (
    <Button size="small" onClick={openAnalysisModal} disabled={!hasSomethingToShow}>
      Ver análise
    </Button>
  );
}
