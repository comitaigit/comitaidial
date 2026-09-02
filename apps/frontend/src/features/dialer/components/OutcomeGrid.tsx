import type { DialerOutcomeId } from "@/features/dialer/hooks/useDialerStage";

const OUTCOMES: {
  id: DialerOutcomeId;
  label: string;
  sublabel: string;
  border: string;
  bg: string;
  color: string;
  hoverBg: string;
}[] = [
  {
    id: "meeting_booked",
    label: "✓ Reunião",
    sublabel: "agendada",
    border: "#BBF7D0",
    bg: "#F0FDF4",
    color: "#15803D",
    hoverBg: "#DCFCE7",
  },
  {
    id: "follow_up",
    label: "↩ Follow-up",
    sublabel: "ligar depois",
    border: "#E2E8F0",
    bg: "#FFF",
    color: "#475569",
    hoverBg: "#F1F5F9",
  },
  {
    id: "voicemail",
    label: "⬤ Voicemail",
    sublabel: "mensagem",
    border: "#E2E8F0",
    bg: "#FFF",
    color: "#475569",
    hoverBg: "#F1F5F9",
  },
  {
    id: "no_interest",
    label: "✕ Sem interesse",
    sublabel: "não qualificado",
    border: "#FCA5A5",
    bg: "#FFF",
    color: "#DC2626",
    hoverBg: "#F1F5F9",
  },
  {
    id: "wrong_contact",
    label: "≠ Errado",
    sublabel: "não era o contato",
    border: "#E2E8F0",
    bg: "#FFF",
    color: "#475569",
    hoverBg: "#F1F5F9",
  },
  {
    id: "invalid_number",
    label: "⊘ Inválido",
    sublabel: "número errado",
    border: "#E2E8F0",
    bg: "#FFF",
    color: "#475569",
    hoverBg: "#F1F5F9",
  },
];

export function OutcomeGrid({
  selected,
  onSelect,
}: {
  selected: DialerOutcomeId | null;
  onSelect: (outcome: DialerOutcomeId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 px-8 py-4">
      {OUTCOMES.map((outcome) => (
        <button
          key={outcome.id}
          onClick={() => onSelect(outcome.id)}
          className="flex flex-col items-start rounded-[8px] border px-2 py-2.5 text-left transition-colors"
          style={{
            borderColor: outcome.border,
            background: selected === outcome.id ? outcome.hoverBg : outcome.bg,
            color: outcome.color,
          }}
        >
          <span className="text-[12px] font-[700] leading-tight">{outcome.label}</span>
          <span className="text-[10px] font-[400] leading-tight">{outcome.sublabel}</span>
        </button>
      ))}
    </div>
  );
}
