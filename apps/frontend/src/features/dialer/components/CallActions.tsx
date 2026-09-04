export function CallActions({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="flex items-center gap-3 px-8 py-4">
      <button
        onClick={onEnd}
        className="rounded-[8px] bg-[#0F172A] px-4 py-2 text-[14px] font-[700] text-white transition-colors hover:bg-[#1E293B]"
      >
        Encerrar e classificar
      </button>
      <button className="rounded-[8px] border border-[#E2E8F0] bg-white px-4 py-2 text-[12px] font-[600] text-[#64748B] transition-colors hover:bg-[#F8FAFC]">
        Mudo · Transferir · Anotar
      </button>
    </div>
  );
}
