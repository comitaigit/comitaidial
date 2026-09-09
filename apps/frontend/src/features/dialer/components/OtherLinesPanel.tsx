export function OtherLinesPanel({
  lines,
}: {
  lines: { line: number; name: string; company: string }[];
}) {
  if (lines.length === 0) return null;

  return (
    <div className="mx-8 mb-4 rounded-[8px] bg-[#F8FAFC] px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
        Outras linhas
      </p>
      {lines.map((line) => (
        <div key={line.line} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <span className="rounded-[3px] bg-[#E2E8F0] px-1 py-0.5 text-[10px] font-medium text-[#64748B]">
              L{line.line}
            </span>
            <span className="text-[12px] text-[#0F172A]">{line.name}</span>
            <span className="text-[12px] text-[#94A3B8]">{line.company}</span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">não atendeu</span>
        </div>
      ))}
    </div>
  );
}
