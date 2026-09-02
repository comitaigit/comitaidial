const OUTCOME_LABEL: Record<string, string> = {
  VOICEMAIL: "Caixa postal",
  WRONG_PERSON: "Pessoa errada",
  BUSY: "Ocupado",
  NO_ANSWER: "Não atendeu",
  INVALID_NUMBER: "Número inválido",
  CALLBACK_REQUESTED: "Retorno solicitado",
  MEETING_SCHEDULED: "Reunião agendada",
  NOT_INTERESTED: "Sem interesse",
};

function formatRingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DialCard({
  contactName,
  title,
  company,
  phone,
  linkedinUrl,
  callAttemptsCount,
  lastOutcome,
  secondsRinging,
  onSkip,
}: {
  contactName: string;
  title: string;
  company: string;
  phone: string;
  linkedinUrl: string | null;
  callAttemptsCount: number;
  lastOutcome: string | null;
  secondsRinging: number;
  onSkip: () => void;
}) {
  const outcomeLabel = lastOutcome ? (OUTCOME_LABEL[lastOutcome] ?? lastOutcome) : null;

  return (
    <div className="flex flex-col rounded-[12px] border border-[#E2E8F0] bg-white px-6 py-6">
      {/* Pulse rings + phone icon */}
      <div className="relative mx-auto mb-5" style={{ width: 48, height: 48 }}>
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
      <p className="text-center text-[15px] font-[700] text-[#0F172A]">{contactName}</p>
      {(title || company) && (
        <p className="mt-0.5 text-center text-[12px] text-[#64748B]">
          {[title, company].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* Divider */}
      <div className="my-4 h-px bg-[#F1F5F9]" />

      {/* Phone + attempts */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-[#0F172A]">{phone}</span>
        {callAttemptsCount > 0 && (
          <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-[600] text-[#64748B]">
            {callAttemptsCount} {callAttemptsCount === 1 ? "tentativa" : "tentativas"}
          </span>
        )}
      </div>

      {/* Last outcome */}
      {outcomeLabel && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-[600] uppercase tracking-[0.8px] text-[#CBD5E1]">
            Último:
          </span>
          <span className="text-[11px] text-[#64748B]">{outcomeLabel}</span>
        </div>
      )}

      {/* LinkedIn */}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </a>
      )}

      {/* Ringing timer */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
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
        className="mt-3 text-center text-[12px] font-medium text-[#94A3B8] transition-colors hover:text-[#64748B]"
      >
        Pular →
      </button>
    </div>
  );
}
