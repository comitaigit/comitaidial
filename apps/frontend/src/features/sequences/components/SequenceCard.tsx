import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Cadence } from "@/features/sequences/data/cadences-api";

export function SequenceCard({ sequence }: { sequence: Cadence }) {
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
    </Card>
  );
}
