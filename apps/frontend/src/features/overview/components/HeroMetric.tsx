export function HeroMetric({
  conversations,
  meetingsScheduled,
  isLoading,
}: {
  conversations: number | null;
  meetingsScheduled: number | null;
  isLoading: boolean;
}) {
  return (
    <div className="mb-5">
      <div
        className="font-[900] leading-[0.88] tracking-[-5px] text-[#0f172a]"
        style={{ fontSize: "80px" }}
      >
        {isLoading ? (
          <span className="text-[#e2e8f0]">–</span>
        ) : (
          (conversations ?? 0)
        )}
      </div>
      <div className="mt-2 text-[15px] font-normal leading-snug tracking-[-0.2px] text-[#94a3b8]">
        conversas reais hoje
      </div>
      {meetingsScheduled !== null && (
        <div className="mt-3 flex items-center gap-3">
          <span className="whitespace-nowrap text-[11px] font-semibold text-[#64748b]">
            Reuniões agendadas
          </span>
          <span className="text-[11px] font-semibold text-[#0f172a]">{meetingsScheduled}</span>
        </div>
      )}
    </div>
  );
}
