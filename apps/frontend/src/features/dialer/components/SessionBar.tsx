export function SessionBar({
  callsMade,
  callsGoal,
  connections,
  connectionRate,
  conversations,
  conversationsGoal,
  progressPercent,
  onPause,
}: {
  callsMade: number;
  callsGoal: number;
  connections: number;
  connectionRate: number;
  conversations: number;
  conversationsGoal: number;
  progressPercent: number;
  onPause: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#F1F5F9] bg-white px-9 py-3.5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-[#2563EB]"
            style={{ animation: "live-pulse 1.4s ease-in-out infinite" }}
          />
          <span className="text-[11px] font-semibold text-[#2563EB]">Sessão ativa</span>
        </div>
        <span className="text-[#E2E8F0]">|</span>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-[800] text-[#0F172A]">
              {callsMade}/{callsGoal}
            </span>
            <span className="text-[11px] text-[#94A3B8]">calls</span>
          </div>
          <span className="text-[#E2E8F0]">·</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-[800] text-[#0F172A]">{connections}</span>
            <span className="text-[11px] text-[#94A3B8]">
              conexões ({connectionRate}%)
            </span>
          </div>
          <span className="text-[#E2E8F0]">·</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-[800] text-[#0F172A]">
              {conversations}/{conversationsGoal}
            </span>
            <span className="text-[11px] text-[#94A3B8]">conversas meta</span>
          </div>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E2E8F0]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-[#94A3B8]">{progressPercent}%</span>
        </div>
      </div>
      <button
        onClick={onPause}
        className="rounded-[8px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
      >
        Pausar sessão
      </button>
    </div>
  );
}
