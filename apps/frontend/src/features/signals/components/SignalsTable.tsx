import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { Signal, SignalCategory } from "@/features/signals/data/signals-api";

const CATEGORY_LABEL: Record<SignalCategory, string> = {
  PERSON: "Pessoa",
  COMPANY: "Empresa",
  ENGAGEMENT: "Engajamento",
  AI_INTERPRETATION: "Interpretação de IA",
};

const CATEGORY_VARIANT: Record<SignalCategory, "ok" | "warn" | "bad" | "info" | "default"> = {
  PERSON: "default",
  COMPANY: "default",
  ENGAGEMENT: "ok",
  AI_INTERPRETATION: "info",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SignalsTable({ signals }: { signals: Signal[] }) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Quando</Th>
            <Th>Categoria</Th>
            <Th>Sinal</Th>
            <Th>Account</Th>
            <Th>Prospect</Th>
            <Th>Origem</Th>
          </Tr>
        </Thead>
        <Tbody>
          {signals.map((signal) => (
            <Tr key={signal.id}>
              <Td>{formatWhen(signal.occurredAt)}</Td>
              <Td>
                <Tag variant={CATEGORY_VARIANT[signal.category]}>
                  {CATEGORY_LABEL[signal.category]}
                </Tag>
              </Td>
              <Td>{signal.summary}</Td>
              <Td>{signal.account?.name ?? "—"}</Td>
              <Td>{signal.person?.name ?? "—"}</Td>
              <Td>{signal.source ?? "—"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
