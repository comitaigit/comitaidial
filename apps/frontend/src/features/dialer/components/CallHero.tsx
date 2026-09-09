function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CallHero({
  name,
  title,
  company,
  elapsedSeconds,
}: {
  name: string;
  title: string;
  company: string;
  elapsedSeconds: number;
}) {
  return (
    <div className="px-8 pb-5 pt-6">
      <p className="text-[38px] font-[900] leading-tight tracking-[-1px] text-[#0F172A]">
        {name}
      </p>
      {(title || company) && (
        <p className="mt-1 text-[15px] text-[#64748B]">
          {[title, company].filter(Boolean).join(" · ")}
        </p>
      )}
      <p
        className="mt-3 text-[36px] font-[800] text-[#16A34A]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatTimer(elapsedSeconds)}
      </p>
    </div>
  );
}
