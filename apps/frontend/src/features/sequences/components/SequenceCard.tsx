import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Sequence } from "@/features/sequences/data/sequences";

export function SequenceCard({ sequence }: { sequence: Sequence }) {
  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <div>
          <b>{sequence.name}</b>
          <div className="text-[13px] text-muted">
            {sequence.peopleCount} pessoas
          </div>
        </div>
        <Tag variant="ok">Ativa</Tag>
      </div>
      <div className="mt-4 grid gap-2">
        {sequence.events.map((event) => (
          <div key={event.day} className="grid grid-cols-[80px_1fr] gap-2.5 text-xs">
            <time className="text-muted">{event.day}</time>
            <div>{event.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
