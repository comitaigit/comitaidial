export function FooterStats({
  calls,
  connectionRate,
}: {
  calls: number | null;
  connectionRate: number | null;
}) {
  if (calls === null && connectionRate === null) return null;

  return (
    <div className="mt-1 flex items-center gap-1.5 border-t border-[#f1f5f9] pt-3.5">
      {calls !== null && (
        <>
          <span className="text-[12px] text-[#94a3b8]">{calls} calls</span>
          {connectionRate !== null && (
            <span className="text-[12px] text-[#e2e8f0]">·</span>
          )}
        </>
      )}
      {connectionRate !== null && (
        <span className="text-[12px] text-[#94a3b8]">{connectionRate}% conexão</span>
      )}
    </div>
  );
}
