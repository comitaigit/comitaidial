import "server-only";

export type SequenceEvent = { day: string; label: string };

export type Sequence = {
  name: string;
  peopleCount: number;
  active: boolean;
  events: SequenceEvent[];
};

export async function getSequences(): Promise<Sequence[]> {
  return [
    {
      name: "Outbound RH #1",
      peopleCount: 72,
      active: true,
      events: [
        { day: "D0", label: "☎ Bloco de ligação" },
        { day: "D1", label: "in Convite manual" },
        { day: "D3", label: "☎ Nova tentativa" },
        { day: "D5", label: "WA Ação manual" },
      ],
    },
    {
      name: "Outbound SaaS",
      peopleCount: 41,
      active: true,
      events: [
        { day: "D0", label: "in Visita + convite manual" },
        { day: "D1", label: "☎ Bloco de ligação" },
        { day: "D4", label: "WA Ação manual" },
      ],
    },
  ];
}
