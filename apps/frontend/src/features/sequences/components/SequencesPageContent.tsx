"use client";

import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { SequenceCard } from "@/features/sequences/components/SequenceCard";
import { useSequencesPage } from "@/features/sequences/hooks/useSequencesPage";

export function SequencesPageContent() {
  const { cadences, isLoading, error } = useSequencesPage();

  if (isLoading) return <p className="text-sm text-muted">Carregando cadências…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  return (
    <div className="grid gap-3.5 lg:grid-cols-3">
      {cadences.map((cadence) => (
        <SequenceCard key={cadence.id} sequence={cadence} />
      ))}
      <Card padded>
        <div className="flex items-center justify-between">
          <div>
            <b>Regra transversal</b>
            <div className="text-[13px] text-muted">vale para todos os canais</div>
          </div>
          <Tag variant="info">Core</Tag>
        </div>
        <div className="mt-4 rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
          Se a pessoa responder em qualquer canal, ela sai imediatamente de
          toda tentativa automática de outro canal.
        </div>
        <p className="mt-2.5 text-[10px] leading-relaxed text-muted">
          Na V0, WhatsApp e LinkedIn continuam manuais; a regra impede que o
          dialer continue insistindo após resposta.
        </p>
      </Card>
    </div>
  );
}
