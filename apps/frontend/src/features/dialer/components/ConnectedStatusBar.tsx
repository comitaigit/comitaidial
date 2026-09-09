export function ConnectedStatusBar({ contactName }: { contactName: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#BBF7D0] bg-[#F0FDF4] px-8 py-3">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-[#16A34A]"
        style={{ animation: "live-pulse 1.4s ease-in-out infinite" }}
      />
      <span className="text-[13px] font-[600] text-[#15803D]">Chamada conectada</span>
      <span className="text-[#BBF7D0]">·</span>
      <span className="truncate text-[12px] text-[#15803D]">{contactName}</span>
    </div>
  );
}
