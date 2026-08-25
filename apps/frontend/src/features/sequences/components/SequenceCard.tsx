"use client";

import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { useSequenceCard } from "@/features/sequences/hooks/useSequenceCard";
import type { Cadence } from "@/features/sequences/data/cadences-api";

export function SequenceCard({ sequence }: { sequence: Cadence }) {
  const { openCompanyForm } = useSequenceCard(sequence);

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <div>
          <b>{sequence.name}</b>
          <div className="text-[13px] text-muted">
            {sequence._count.enrollments} pessoas
          </div>
        </div>
        <Tag variant={sequence.active ? "ok" : "default"}>
          {sequence.active ? "Ativa" : "Pausada"}
        </Tag>
      </div>
      <div className="mt-4 text-xs text-muted">
        {sequence._count.steps === 0
          ? "Nenhum step configurado ainda"
          : `${sequence._count.steps} step${sequence._count.steps > 1 ? "s" : ""} configurado${sequence._count.steps > 1 ? "s" : ""}`}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {sequence.clientCompany ? (
          <span className="text-[11px] text-muted">
            {sequence.clientCompany.name} — {sequence.clientCompany.mainProduct}
          </span>
        ) : (
          <Tag variant="warn">Incompleta — sem empresa/produto</Tag>
        )}
        <Button size="small" onClick={openCompanyForm}>
          {sequence.clientCompany ? "Trocar" : "Definir"}
        </Button>
      </div>
    </Card>
  );
}
