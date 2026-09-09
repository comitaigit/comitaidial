import type { ParallelBatchLeg, ParallelLegStatus } from "@/features/dialer/data/dialer-api";

const STATUS_LABEL: Record<ParallelLegStatus, string> = {
  RINGING: "Discando",
  MACHINE_DETECTED: "Caixa postal",
  NO_ANSWER: "Não atendeu",
  BUSY: "Ocupado",
  FAILED: "Falhou",
  CONNECTED: "Atendeu",
  ABANDONED: "Encerrada",
};

const STATUS_COLOR: Record<ParallelLegStatus, string> = {
  RINGING: "text-[#2563EB]",
  MACHINE_DETECTED: "text-[#94A3B8]",
  NO_ANSWER: "text-[#94A3B8]",
  BUSY: "text-[#94A3B8]",
  FAILED: "text-[#DC2626]",
  CONNECTED: "text-[#16A34A]",
  ABANDONED: "text-[#94A3B8]",
};

function formatRingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ParallelDialCards({
  legs,
  legStatuses,
  secondsRinging,
  onCancel,
}: {
  legs: ParallelBatchLeg[];
  legStatuses: Record<string, ParallelLegStatus>;
  secondsRinging: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {legs.map((leg) => {
          const status = legStatuses[leg.callId] ?? "RINGING";
          const isRinging = status === "RINGING";
          return (
            <div
              key={leg.callId}
              className="flex flex-col items-center rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-5"
            >
              <div className="relative mb-3" style={{ width: 36, height: 36 }}>
                {isRinging && (
                  <div
                    className="absolute rounded-full border-2 border-[#2563EB]"
                    style={{
                      top: -6,
                      right: -6,
                      bottom: -6,
                      left: -6,
                      opacity: 0.25,
                      animation: "dial-ring 2s ease-in-out infinite",
                    }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#EFF6FF]">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.5 2.5h2.8l1.6 3.8-1.8 1.4c.9 2 3.2 4.2 5.2 5.1l1.6-1.8 3.8 1.6v2.8c0 .6-.5 1-1.1.9C8.3 15 3.3 10 3.6 3.6c0-.6.4-1.1.9-1.1h1z"
                      fill="#2563EB"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-[13px] font-[700] text-[#0F172A]">{leg.name}</p>
              <p className="mt-0.5 text-center text-[11px] text-[#64748B]">{leg.accountName}</p>
              <p className="mt-1 font-mono text-[11px] text-[#94A3B8]">{leg.phone}</p>
              <p className={`mt-2 text-[11px] font-[600] ${STATUS_COLOR[status]}`}>
                {STATUS_LABEL[status]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#2563EB]"
          style={{ animation: "live-pulse 1.4s ease-in-out infinite" }}
        />
        <span className="text-[12px] text-[#2563EB]">
          {formatRingTime(secondsRinging)} discando · {legs.length}{" "}
          {legs.length === 1 ? "linha" : "linhas"}
        </span>
      </div>

      <button
        onClick={onCancel}
        className="text-center text-[12px] font-medium text-[#94A3B8] transition-colors hover:text-[#64748B]"
      >
        Encerrar discagem
      </button>
    </div>
  );
}
