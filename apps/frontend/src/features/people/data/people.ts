import "server-only";

export type Person = {
  initials: string;
  name: string;
  role: string;
  account: string;
  identifiers: string;
  decisionLevel: string;
  sequence: string;
  sequenceVariant: "info" | "warn";
  lastOutcome: string;
};

export async function getPeople(): Promise<Person[]> {
  return [
    {
      initials: "AM",
      name: "Ana Martins",
      role: "Head de RH",
      account: "Grupo Atlas",
      identifiers: "☎ · @ · in",
      decisionLevel: "Alto",
      sequence: "Outbound RH #1",
      sequenceVariant: "info",
      lastOutcome: "Sem contato",
    },
    {
      initials: "RC",
      name: "Rafael Costa",
      role: "Diretor Comercial",
      account: "NovaLog",
      identifiers: "☎ · WA · @ · in",
      decisionLevel: "Alto",
      sequence: "Pausada",
      sequenceVariant: "warn",
      lastOutcome: "Callback agendado",
    },
    {
      initials: "JM",
      name: "João Melo",
      role: "VP Sales",
      account: "FitPay",
      identifiers: "☎ · @ · in",
      decisionLevel: "Alto",
      sequence: "Outbound SaaS",
      sequenceVariant: "info",
      lastOutcome: "Convite aceito",
    },
  ];
}
