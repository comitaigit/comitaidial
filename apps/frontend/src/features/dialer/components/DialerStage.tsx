"use client";

import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import type { DialerBlockData } from "@/features/dialer/data/dialer";
import { useDialerStage } from "@/features/dialer/hooks/useDialerStage";
import { OutcomePanel } from "@/features/dialer/components/OutcomePanel";

export function DialerStage({ block }: { block: DialerBlockData }) {
  const {
    dialing,
    connected,
    lines,
    title,
    subtitle,
    pulse,
    startDial,
    stopDial,
    handleOutcomeSaved,
  } = useDialerStage(block);

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHead>
          <CardTitle>Bloco: {block.blockName}</CardTitle>
          <Tag>{block.contactsRemaining} contatos restantes</Tag>
        </CardHead>
        <div className="p-4.5">
          <div className="p-5.5 text-center">
            <div className="mx-auto mb-3 grid h-18.5 w-18.5 place-items-center rounded-full border-2 border-dashed border-[#8d95a3] text-[22px] font-black">
              {pulse}
            </div>
            <h2 className="m-0 mb-1.5 text-lg">{title}</h2>
            <p className="text-[13px] text-muted">{subtitle}</p>
          </div>

          <div className="my-4 grid grid-cols-3 gap-2">
            {lines.map((state, i) => (
              <div
                key={i}
                className="rounded-[10px] border border-line bg-[#fafbfc] p-2.5 text-center"
              >
                <span className="text-[10px] text-muted">Linha {i + 1}</span>
                <strong className="mt-0.5 block text-xs">{state}</strong>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Button variant="primary" onClick={startDial} disabled={dialing}>
              Iniciar discagem 3x
            </Button>
            <Button variant="bad" onClick={stopDial} disabled={!dialing}>
              Encerrar bloco
            </Button>
          </div>

          <div className="mt-4 rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
            Toda tentativa cria uma <b>Interaction</b>, mesmo sem conexão.
            Caixa postal não conta como conversa humana. Dois atendimentos
            simultâneos geram registro explícito de abandono.
          </div>
        </div>
      </Card>

      <OutcomePanel
        block={block}
        active={connected}
        onOutcomeSaved={handleOutcomeSaved}
      />
    </div>
  );
}
