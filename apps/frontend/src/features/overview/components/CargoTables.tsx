import { cn } from "@/lib/cn";
import type { CargoRow } from "@/features/overview/data/overview-api";

function CargoTable({ title, rows }: { title: string; rows: CargoRow[] }) {
  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[1px] text-[#cbd5e1]">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-[#94a3b8]">Sem dados suficientes ainda.</p>
      ) : (
        <div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid items-center border-b border-[#f8fafc] py-1.5 last:border-b-0"
              style={{ gridTemplateColumns: "1fr 36px 36px", gap: "8px" }}
            >
              <span className="text-[12px] font-medium text-[#64748b]">{row.label}</span>
              <span className="text-right text-[13px] font-bold text-[#0f172a]">{row.count}</span>
              <span
                className={cn(
                  "text-right text-[12px]",
                  row.highlight === "success"
                    ? "font-semibold text-[#16a34a]"
                    : row.highlight === "danger"
                      ? "font-semibold text-[#dc2626]"
                      : "font-normal text-[#94a3b8]",
                )}
              >
                {row.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CargoTables({
  conversations,
  meetings,
}: {
  conversations: CargoRow[];
  meetings: CargoRow[];
}) {
  return (
    <div className="mb-4 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <CargoTable title="Conversas por cargo" rows={conversations} />
      <CargoTable title="Reuniões por cargo" rows={meetings} />
    </div>
  );
}
