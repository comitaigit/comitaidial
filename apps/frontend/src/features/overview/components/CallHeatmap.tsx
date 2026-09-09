const HEATMAP_COLORS = [
  "#F8FAFC", // 0 – vazio
  "#E0F2FE", // 1 – baixo
  "#BAE6FD", // 2
  "#7DD3FC", // 3
  "#2563EB", // 4
  "#1E40AF", // 5 – alto
];

function pctToLevel(pct: number): number {
  if (pct === 0) return 0;
  if (pct < 10) return 1;
  if (pct < 20) return 2;
  if (pct < 30) return 3;
  if (pct < 40) return 4;
  return 5;
}

function HeatCell({
  value,
  dayLabel,
  hourLabel,
}: {
  value: number;
  dayLabel: string;
  hourLabel: string;
}) {
  const level = pctToLevel(value);
  return (
    <div
      title={`${dayLabel} ${hourLabel}: ${value}%`}
      className="h-[18px] w-9 shrink-0 rounded-[3px]"
      style={{ background: HEATMAP_COLORS[level] }}
    />
  );
}

export function CallHeatmap({
  data,
  hours,
  days,
}: {
  data: number[][];
  hours: string[];
  days: string[];
}) {
  const hasData = data.some((row) => row.some((v) => v > 0));

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#cbd5e1]">
          Melhor horário para ligar
        </span>
        <span className="text-[10px] text-[#e2e8f0]">
          · últimos 15 dias · % de atendimento
        </span>
      </div>

      {!hasData ? (
        <p className="text-[12px] text-[#94a3b8]">
          Dados disponíveis após 15 dias de discagem.
        </p>
      ) : (
        <div className="inline-flex flex-col gap-0.5 overflow-x-auto">
          {hours.map((hour, hi) => (
            <div key={hour} className="flex items-center gap-0.5">
              <span className="w-7 shrink-0 pr-1.5 text-right text-[10px] text-[#94a3b8]">
                {hour}
              </span>
              {days.map((day, di) => (
                <HeatCell
                  key={di}
                  value={data[hi]?.[di] ?? 0}
                  dayLabel={day}
                  hourLabel={hour}
                />
              ))}
            </div>
          ))}
          {/* Day labels row */}
          <div className="mt-1 flex items-center gap-0.5">
            <span className="w-7 shrink-0" />
            {days.map((day, di) => (
              <span
                key={di}
                className="w-9 shrink-0 text-center text-[9px] text-[#94a3b8]"
              >
                {day}
              </span>
            ))}
          </div>
          {/* Legend */}
          <div className="ml-7 mt-2.5 flex items-center gap-1.5">
            <span className="text-[9px] text-[#cbd5e1]">menos</span>
            {HEATMAP_COLORS.slice(1).map((color) => (
              <div
                key={color}
                className="h-2.5 w-3.5 rounded-[2px]"
                style={{ background: color }}
              />
            ))}
            <span className="text-[9px] text-[#cbd5e1]">mais atendimento</span>
          </div>
        </div>
      )}
    </div>
  );
}
