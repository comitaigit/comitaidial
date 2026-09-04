"use client";

import { CallsTable } from "@/features/calls/components/CallsTable";
import { useCallsPage } from "@/features/calls/hooks/useCallsPage";

export function CallsPageContent() {
  const { calls, isLoading, error } = useCallsPage();

  if (isLoading) return <p className="text-sm text-muted">Carregando chamadas…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (calls.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhuma chamada registrada ainda. Ligações feitas pelo Dialer ou por{" "}
        <code>POST /v1/calls/test</code> aparecem aqui.
      </p>
    );
  }

  return <CallsTable calls={calls} />;
}
