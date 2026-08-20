import "server-only";

export type WorkQueueItem = {
  initials: string;
  name: string;
  role: string;
  account: string;
  action: string;
  actionVariant: "default" | "ok" | "info";
  reason: string;
  goto: "/dialer" | "/inbox";
};

export type ChannelHealthSummary = {
  icon: string;
  name: string;
  detail: string;
  status: string;
  variant: "ok" | "warn" | "bad";
};

export type OverviewData = {
  bdrName: string;
  kpis: {
    conversations: number;
    attempts: number;
    costPerConversation: string;
    abandonment: string;
  };
  workQueue: WorkQueueItem[];
  channelHealth: ChannelHealthSummary[];
};

// Simulates a server-side fetch (DB / API) for the Overview slice.
// Swap this for a real data source without touching any component.
export async function getOverviewData(): Promise<OverviewData> {
  return {
    bdrName: "Marilia",
    kpis: {
      conversations: 18,
      attempts: 94,
      costPerConversation: "R$ 14,80",
      abandonment: "2,1%",
    },
    workQueue: [
      {
        initials: "AM",
        name: "Ana Martins",
        role: "Head de RH",
        account: "Grupo Atlas",
        action: "☎ Ligar",
        actionVariant: "default",
        reason: "2 tentativas · sem resposta",
        goto: "/dialer",
      },
      {
        initials: "RC",
        name: "Rafael Costa",
        role: "Diretor Comercial",
        account: "NovaLog",
        action: "WA Responder",
        actionVariant: "ok",
        reason: "Mensagem recebida há 12 min",
        goto: "/inbox",
      },
      {
        initials: "JM",
        name: "João Melo",
        role: "VP Sales",
        account: "FitPay",
        action: "in LinkedIn",
        actionVariant: "info",
        reason: "Aceitou conexão ontem",
        goto: "/inbox",
      },
    ],
    channelHealth: [
      {
        icon: "☎",
        name: "Voz",
        detail: "+55 11 4040-2026",
        status: "Operacional",
        variant: "ok",
      },
      {
        icon: "WA",
        name: "WhatsApp",
        detail: "+55 11 98888-0101",
        status: "Conectado",
        variant: "ok",
      },
      {
        icon: "in",
        name: "LinkedIn",
        detail: "Marilia Souza",
        status: "62% limite hoje",
        variant: "warn",
      },
    ],
  };
}
