"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CallablePerson } from "@/features/dialer/data/dialer-api";
import { OUTCOME_OPTIONS, useOutcomePanel } from "@/features/dialer/hooks/useOutcomePanel";

export function OutcomePanel({
  person,
  callId,
  durationSeconds,
  active,
  onOutcomeSaved,
}: {
  person: CallablePerson | null;
  callId: string | null;
  durationSeconds: number | null;
  active: boolean;
  onOutcomeSaved: () => void;
}) {
  const { selected, selectOutcome, saveOutcome, saving } = useOutcomePanel(
    callId,
    durationSeconds,
    onOutcomeSaved,
  );

  return (
    <Card>
      <CardHead>
        <CardTitle>Contato atual</CardTitle>
        {person ? <Tag>{person.account.name}</Tag> : null}
      </CardHead>
      <CardBody className="grid gap-2.5">
        {person ? (
          <div>
            <b className="block text-[13px]">{person.name}</b>
            <span className="text-[11px] text-muted">
              {person.role ?? "—"} · {person.phone ?? "sem telefone"}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted">Nenhum contato selecionado.</p>
        )}

        <div className={cn(!active && "pointer-events-none opacity-45")}>
          <div className="mb-2 mt-1 flex items-center justify-between">
            <b className="text-xs">Outcome obrigatório</b>
            <span className="text-[10px] text-muted">1 toque</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OUTCOME_OPTIONS.map((outcome) => (
              <button
                key={outcome.value}
                onClick={() => selectOutcome(outcome.value)}
                className={cn(
                  "rounded-lg border border-line bg-panel px-2.5 py-2 text-left text-[11px]",
                  selected === outcome.value && "border-accent bg-soft"
                )}
              >
                {outcome.label}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            className="mt-2.5 w-full"
            disabled={!selected || saving}
            onClick={saveOutcome}
          >
            Registrar outcome e seguir para o próximo
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
