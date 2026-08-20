import "server-only";

export type Account = {
  name: string;
  domain: string;
  segment: string;
  prospects: number;
  contextStatus: string;
  contextVariant: "ok" | "info" | "default";
  lastInteraction: string;
  status: string;
  statusVariant: "default" | "warn";
};

export async function getAccounts(): Promise<Account[]> {
  return [
    {
      name: "Grupo Atlas",
      domain: "atlas.com.br",
      segment: "Serviços B2B",
      prospects: 4,
      contextStatus: "Cache ativo",
      contextVariant: "ok",
      lastInteraction: "Hoje · Ligação",
      status: "Em cadência",
      statusVariant: "default",
    },
    {
      name: "NovaLog",
      domain: "novalog.com.br",
      segment: "Logística",
      prospects: 3,
      contextStatus: "Cache ativo",
      contextVariant: "ok",
      lastInteraction: "Hoje · WhatsApp",
      status: "Resposta recebida",
      statusVariant: "warn",
    },
    {
      name: "FitPay",
      domain: "fitpay.com.br",
      segment: "Fintech",
      prospects: 5,
      contextStatus: "Atualizar notícia",
      contextVariant: "info",
      lastInteraction: "Ontem · LinkedIn",
      status: "Em cadência",
      statusVariant: "default",
    },
    {
      name: "Solaris Tech",
      domain: "solaristech.com.br",
      segment: "SaaS",
      prospects: 2,
      contextStatus: "Não pesquisado",
      contextVariant: "default",
      lastInteraction: "—",
      status: "Nova",
      statusVariant: "default",
    },
  ];
}
