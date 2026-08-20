import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Guardrail } from "@/features/metrics/data/metrics";

export function GuardrailsCard({ guardrails }: { guardrails: Guardrail[] }) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Guardrails</CardTitle>
      </CardHead>
      <CardBody>
        {guardrails.map((g, i) => (
          <div
            key={g.label}
            className={`flex items-center justify-between py-3 ${
              i < guardrails.length - 1 ? "border-b border-[#eceef2]" : ""
            }`}
          >
            <div>
              <b>{g.label}</b>
              <div className="text-[13px] text-muted">{g.detail}</div>
            </div>
            <Tag variant={g.variant}>{g.value}</Tag>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
