"use client";

import { SignalsTable } from "@/features/signals/components/SignalsTable";
import { useSignalsPage } from "@/features/signals/hooks/useSignalsPage";

export function SignalsPageContent() {
  const { signals, isLoading, error } = useSignalsPage();

  if (isLoading) return <p className="text-sm text-muted">Carregando sinais…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (signals.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhum sinal registrado ainda. Sinais de engajamento aparecem aqui
        automaticamente quando uma ligação termina em reunião marcada,
        callback agendado ou objeção qualificada.
      </p>
    );
  }

  return <SignalsTable signals={signals} />;
}
