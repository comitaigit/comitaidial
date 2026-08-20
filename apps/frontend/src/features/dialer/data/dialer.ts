import "server-only";

export type OutcomeOption = {
  id: string;
  label: string;
};

export type DialerBlockData = {
  blockName: string;
  contactsRemaining: number;
  parallelism: number;
  currentContact: {
    initials: string;
    name: string;
    role: string;
    account: string;
    tier: string;
  };
  facts: Array<{ title: string; body: string; source: string }>;
  objections: Array<{ objection: string; response: string }>;
  outcomes: OutcomeOption[];
};

export const OUTCOMES: OutcomeOption[] = [
  { id: "sem_contato", label: "Sem contato" },
  { id: "caixa_postal", label: "Caixa postal" },
  { id: "conversou_sem_avanco", label: "Conversou · sem avanço" },
  { id: "objecao_qualificada", label: "Objeção qualificada" },
  { id: "callback_agendado", label: "Callback agendado" },
  { id: "reuniao_marcada", label: "Reunião marcada" },
  { id: "numero_invalido", label: "Número inválido" },
  { id: "nao_e_decisor", label: "Não é decisor" },
];

export async function getDialerBlock(): Promise<DialerBlockData> {
  return {
    blockName: "Heads de RH · Sudeste",
    contactsRemaining: 23,
    parallelism: 3,
    currentContact: {
      initials: "AM",
      name: "Ana Martins",
      role: "Head de RH",
      account: "Grupo Atlas",
      tier: "Decisor alto",
    },
    facts: [
      {
        title: "O que a empresa faz",
        body: "Grupo de serviços empresariais com operação nacional e aproximadamente 1.800 colaboradores.",
        source: "Fonte: site institucional · dado público de Account",
      },
      {
        title: "Gancho",
        body: "Expansão recente do time comercial e vagas abertas para SDR/BDR indicam pressão por geração de pipeline.",
        source: "Fonte: página de carreiras · atualizado há 3 dias",
      },
      {
        title: "Histórico do tenant",
        body: "Ligação sem contato em 14/08 · convite LinkedIn enviado em 15/08.",
        source: "Fonte: Interactions do workspace Comitai",
      },
    ],
    objections: [
      {
        objection: "“Já usamos Apollo.”",
        response: "Resposta: separar dado de contato de execução multicanal.",
      },
      {
        objection: "“Nosso time não liga muito.”",
        response:
          "Resposta: medir conversa/dia e custo por conversa antes de escalar.",
      },
    ],
    outcomes: OUTCOMES,
  };
}
