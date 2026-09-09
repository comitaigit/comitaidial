import { Button } from "@/components/ui/Button";
import type { WindowDays } from "@/features/funnel/data/funnel-api";

const OPTIONS: { days: WindowDays; label: string }[] = [
  { days: 7, label: "Semanal" },
  { days: 15, label: "Quinzenal" },
  { days: 30, label: "Mensal" },
];

export function PeriodFilter({
  value,
  onChange,
}: {
  value: WindowDays;
  onChange: (days: WindowDays) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.days}
          size="small"
          variant={value === opt.days ? "primary" : "default"}
          onClick={() => onChange(opt.days)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
