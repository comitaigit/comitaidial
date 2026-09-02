function formatRingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DialCard({
  contactName,
  title,
  company,
  secondsRinging,
  onSkip,
}: {
  contactName: string;
  title: string;
  company: string;
  secondsRinging: number;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[12px] border border-[#E2E8F0] bg-white px-6 py-7">
      {/* Pulse rings + phone icon */}
      <div className="relative mb-5" style={{ width: 48, height: 48 }}>
        <div
          className="absolute rounded-full border-2 border-[#2563EB]"
          style={{
            top: -8,
            right: -8,
            bottom: -8,
            left: -8,
            opacity: 0.2,
            animation: "dial-ring 2s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full border-2 border-[#2563EB]"
          style={{
            top: -4,
            right: -4,
            bottom: -4,
            left: -4,
            opacity: 0.35,
            animation: "dial-ring 2s ease-in-out 0.4s infinite",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#EFF6FF]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3.5 2.5h2.8l1.6 3.8-1.8 1.4c.9 2 3.2 4.2 5.2 5.1l1.6-1.8 3.8 1.6v2.8c0 .6-.5 1-1.1.9C8.3 15 3.3 10 3.6 3.6c0-.6.4-1.1.9-1.1h1z"
              fill="#2563EB"
            />
          </svg>
        </div>
      </div>

      {/* Contact info */}
      <p className="text-[15px] font-[700] text-[#0F172A]">{contactName}</p>
      {(title || company) && (
        <p className="mt-0.5 text-[12px] text-[#64748B]">
          {[title, company].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* Ringing timer */}
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#2563EB]"
          style={{ animation: "live-pulse 1.4s ease-in-out infinite" }}
        />
        <span className="text-[12px] text-[#2563EB]">
          {formatRingTime(secondsRinging)} discando
        </span>
      </div>

      <button
        onClick={onSkip}
        className="mt-4 text-[12px] font-medium text-[#94A3B8] transition-colors hover:text-[#64748B]"
      >
        Pular →
      </button>
    </div>
  );
}
