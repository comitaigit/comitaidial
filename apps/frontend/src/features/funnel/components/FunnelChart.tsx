import { Card } from "@/components/ui/Card";
import { Bar } from "@/components/ui/Bar";
import type { Funnel } from "@/features/funnel/data/funnel-api";

export function FunnelChart({ funnel }: { funnel: Funnel }) {
  const stages = [
    { label: "Tentativas", value: funnel.attempts },
    { label: "Conectadas", value: funnel.connected },
    { label: "Conversas", value: funnel.conversations },
    { label: "Reuniões agendadas", value: funnel.meetingsScheduled },
  ];
  const max = Math.max(1, funnel.attempts);

  return (
    <Card padded>
      <div className="flex flex-col gap-4">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-muted">{stage.label}</span>
              <span className="font-semibold">{stage.value}</span>
            </div>
            <Bar percent={(stage.value / max) * 100} />
          </div>
        ))}
      </div>
    </Card>
  );
}
