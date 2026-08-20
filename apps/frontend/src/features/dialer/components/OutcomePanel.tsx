"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { DialerBlockData } from "@/features/dialer/data/dialer";
import { useOutcomePanel } from "@/features/dialer/hooks/useOutcomePanel";

export function OutcomePanel({
  block,
  active,
  onOutcomeSaved,
}: {
  block: DialerBlockData;
  active: boolean;
  onOutcomeSaved: () => void;
}) {
  const { selected, selectOutcome, saveOutcome } = useOutcomePanel(block, onOutcomeSaved);
  const { currentContact, facts, objections, outcomes } = block;

  return (
    <Card>
      <CardHead>
        <CardTitle>Contexto ao conectar</CardTitle>
        <Tag variant="ok">cacheado</Tag>
      </CardHead>
      <CardBody className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef0f4] text-sm font-bold">
              {currentContact.initials}
            </div>
            <div>
              <b className="block text-[13px]">{currentContact.name}</b>
              <span className="text-[11px] text-muted">
                {currentContact.role} · {currentContact.account}
              </span>
            </div>
          </div>
          <Tag>{currentContact.tier}</Tag>
        </div>

        {facts.map((fact) => (
          <div
            key={fact.title}
            className="rounded-[9px] border border-dashed border-[#cbd1da] bg-[#fbfcfd] p-2.5"
          >
            <b className="mb-1 block text-[11px]">{fact.title}</b>
            <p className="text-xs leading-relaxed">{fact.body}</p>
            <div className="mt-1.5 text-[10px] text-[#52606d]">
              {fact.source}
            </div>
          </div>
        ))}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {objections.map((item) => (
            <div
              key={item.objection}
              className="rounded-[9px] border border-dashed border-[#cbd1da] bg-[#fbfcfd] p-2.5"
            >
              <b className="mb-1 block text-[11px]">Objeção provável</b>
              <p className="text-xs leading-relaxed">{item.objection}</p>
              <div className="mt-1.5 text-[10px] text-[#52606d]">
                {item.response}
              </div>
            </div>
          ))}
        </div>

        <div className={cn(!active && "pointer-events-none opacity-45")}>
          <div className="mb-2 mt-1 flex items-center justify-between">
            <b className="text-xs">Outcome obrigatório</b>
            <span className="text-[10px] text-muted">1 toque</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((outcome) => (
              <button
                key={outcome.id}
                onClick={() => selectOutcome(outcome.id)}
                className={cn(
                  "rounded-lg border border-line bg-panel px-2.5 py-2 text-left text-[11px]",
                  selected === outcome.id && "border-accent bg-soft"
                )}
              >
                {outcome.label}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            className="mt-2.5 w-full"
            disabled={!selected}
            onClick={saveOutcome}
          >
            Registrar outcome e próxima tentativa
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
