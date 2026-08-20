import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { getSequences } from "@/features/sequences/data/sequences";
import { SequenceCard } from "@/features/sequences/components/SequenceCard";
import { NewSequenceButton } from "@/features/sequences/components/NewSequenceButton";

export const metadata: Metadata = {
  title: "Cadências",
};

export default async function SequencesPage() {
  const sequences = await getSequences();

  return (
    <section>
      <PageHeader
        title="Cadências"
        subtitle="Baixa fidelidade: gestão de tentativas e remoção imediata quando há resposta."
        actions={<NewSequenceButton />}
      />
      <div className="grid gap-3.5 lg:grid-cols-3">
        {sequences.map((sequence) => (
          <SequenceCard key={sequence.name} sequence={sequence} />
        ))}
        <Card padded>
          <div className="flex items-center justify-between">
            <div>
              <b>Regra transversal</b>
              <div className="text-[13px] text-muted">
                vale para todos os canais
              </div>
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
    </section>
  );
}
