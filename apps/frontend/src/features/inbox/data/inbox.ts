import "server-only";

export type Message = {
  author: "me" | "them";
  text: string;
  meta: string;
};

export type Thread = {
  id: string;
  initials: string;
  name: string;
  company: string;
  role: string;
  preview: string;
  timeAgo: string;
  paused: boolean;
  messages: Message[];
  notice: string;
};

export async function getThreads(): Promise<Thread[]> {
  return [
    {
      id: "rafael",
      initials: "RC",
      name: "Rafael Costa",
      company: "NovaLog",
      role: "Diretor Comercial",
      preview: 'WA · "Pode me chamar quinta depois das 14h?"',
      timeAgo: "12 min",
      paused: true,
      messages: [
        {
          author: "me",
          text: "Oi Rafael, Lucas aqui da Comitai. Tentei te ligar mais cedo porque queria entender como vocês estão estruturando outbound na NovaLog.",
          meta: "WhatsApp · 09:18",
        },
        {
          author: "them",
          text: "Oi! Estou entrando em reunião. Pode me chamar quinta depois das 14h?",
          meta: "WhatsApp · 09:26",
        },
      ],
      notice:
        "Sugestão detectada: criar callback para quinta após 14h. A resposta já retirou Rafael das tentativas automáticas dos outros canais.",
    },
    {
      id: "joao",
      initials: "JM",
      name: "João Melo",
      company: "FitPay",
      role: "VP Sales",
      preview: "in · aceitou sua conexão",
      timeAgo: "1h",
      paused: false,
      messages: [
        {
          author: "me",
          text: "João, te mandei convite porque vi que vocês estão expandindo o time comercial.",
          meta: "LinkedIn · ontem 16:40",
        },
        { author: "them", text: "Conexão aceita", meta: "LinkedIn · hoje 08:11" },
      ],
      notice:
        "Próxima ação sugerida: mensagem manual no LinkedIn. Nenhum envio será feito automaticamente.",
    },
    {
      id: "ana",
      initials: "AM",
      name: "Ana Martins",
      company: "Grupo Atlas",
      role: "Head de RH",
      preview: "☎ · sem contato",
      timeAgo: "ontem",
      paused: false,
      messages: [
        {
          author: "me",
          text: "Tentativa de ligação sem contato.",
          meta: "Telefone · ontem 15:17",
        },
      ],
      notice:
        "Ana segue ativa na fila porque ainda não houve resposta humana em nenhum canal.",
    },
  ];
}
