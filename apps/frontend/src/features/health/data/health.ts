import "server-only";

export type ChannelHealth = {
  icon: string;
  name: string;
  detail: string;
  status: string;
  variant: "ok" | "warn" | "bad";
  stats: Array<{ label: string; value: string }>;
  barPercent?: number;
  note: string;
};

export type RiskEvent = {
  time: string;
  channel: string;
  event: string;
  action: string;
};

export type HealthData = {
  channels: ChannelHealth[];
  riskEvents: RiskEvent[];
};

export async function getHealth(): Promise<HealthData> {
  return {
    channels: [
      {
        icon: "☎",
        name: "Voz / Twilio",
        detail: "+55 11 4040-2026",
        status: "Online",
        variant: "ok",
        stats: [
          { label: "Abandono hoje", value: "2,1%" },
          { label: "Paralelismo", value: "3x / teto 3x" },
        ],
        barPercent: 21,
        note: "Teto do workspace não é editável pelo BDR.",
      },
      {
        icon: "WA",
        name: "WhatsApp",
        detail: "+55 11 98888-0101",
        status: "Conectado",
        variant: "ok",
        stats: [
          { label: "Mensagens recebidas", value: "27" },
          { label: "Opt-outs", value: "1" },
          { label: "Automação de envio", value: "Desativada" },
        ],
        note: "Toda resposta permanece associada à Person.",
      },
      {
        icon: "in",
        name: "LinkedIn",
        detail: "Marilia Souza",
        status: "Atenção",
        variant: "warn",
        stats: [
          { label: "Ações usadas hoje", value: "62%" },
          { label: "Convites pendentes >10d", value: "4" },
        ],
        barPercent: 62,
        note: "Envio continua manual e sujeito a hard limits.",
      },
    ],
    riskEvents: [
      {
        time: "10:42",
        channel: "☎",
        event: "2 atendimentos simultâneos",
        action: "1 conexão + 1 abandono registrado",
      },
      {
        time: "09:26",
        channel: "WA",
        event: "Resposta de Rafael Costa",
        action: "Removido da fila de discagem",
      },
      {
        time: "08:05",
        channel: "in",
        event: "62% do limite diário",
        action: "Sem bloqueio; apenas monitoramento",
      },
    ],
  };
}
