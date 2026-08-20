import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

export function ConversationsChart({
  baseline,
  current,
}: {
  baseline: string;
  current: string;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Conversas humanas por dia</CardTitle>
        <Tag variant="info">vs baseline</Tag>
      </CardHead>
      <CardBody>
        <div
          className="relative m-1 mb-1 h-42.5 border-b border-l border-line"
          style={{
            background:
              "linear-gradient(to bottom, transparent 24%, #eef0f4 25%, transparent 26%, transparent 49%, #eef0f4 50%, transparent 51%, transparent 74%, #eef0f4 75%, transparent 76%)",
          }}
        >
          <svg viewBox="0 0 600 170" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              fill="none"
              stroke="#9aa1ad"
              strokeWidth="2"
              strokeDasharray="5 5"
              points={baseline}
            />
            <polyline fill="none" stroke="#222831" strokeWidth="3" points={current} />
          </svg>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted">— Atual</span>
          <span className="text-[10px] text-muted">--- Baseline pré-Dial</span>
        </div>
      </CardBody>
    </Card>
  );
}
