import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  delta,
  bad = false,
}: {
  label: string;
  value: string | number;
  delta?: string;
  bad?: boolean;
}) {
  return (
    <Card padded>
      <div className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1.5 text-[27px] font-extrabold">{value}</div>
      {delta ? (
        <div className={cn("mt-1 text-xs", bad ? "text-bad" : "text-ok")}>{delta}</div>
      ) : null}
    </Card>
  );
}
