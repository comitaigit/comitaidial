import { Button } from "@/components/ui/Button";
import type { WindowDays } from "@/features/overview/data/overview-api";

const OPTIONS: { days: WindowDays; label: string }[] = [
  { days: 7, label: "Últimos 7 dias" },
  { days: 15, label: "Últimos 15 dias" },
  { days: 30, label: "Últimos 30 dias" },
];

export function WindowFilter({
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
