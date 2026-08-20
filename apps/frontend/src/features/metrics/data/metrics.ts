import "server-only";

export type Guardrail = {
  label: string;
  detail: string;
  value: string;
  variant: "ok" | "warn";
};

export type MetricsData = {
  kpis: {
    conversationsPerDay: string;
    attemptsPerDay: string;
    conversationToMeeting: string;
    costPerConversation: string;
  };
  guardrails: Guardrail[];
  chart: {
    baseline: string;
    current: string;
  };
};

export async function getMetrics(): Promise<MetricsData> {
  return {
    kpis: {
      conversationsPerDay: "18,4",
      attemptsPerDay: "91",
      conversationToMeeting: "14,1%",
      costPerConversation: "R$ 14,80",
    },
    guardrails: [
      {
        label: "Queda conversa → reunião",
        detail: "limite inicial: −15% relativo",
        value: "−7%",
        variant: "ok",
      },
      {
        label: "Abandono de chamada",
        detail: "2+ atendimentos simultâneos",
        value: "2,1%",
        variant: "warn",
      },
      {
        label: "LinkedIn ações / limite",
        detail: "guardrail diário",
        value: "62%",
        variant: "warn",
      },
      {
        label: "Opt-outs processados",
        detail: "pausa imediata",
        value: "100%",
        variant: "ok",
      },
    ],
    chart: {
      baseline: "0,130 60,125 120,126 180,118 240,120 300,113 360,111 420,109 480,106 540,105 600,101",
      current: "0,132 60,120 120,112 180,86 240,96 300,78 360,66 420,70 480,50 540,42 600,34",
    },
  };
}
