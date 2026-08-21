import Link from "next/link";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { CallOutcome, WorkQueueItem } from "@/features/overview/data/overview-api";

const OUTCOME_LABEL: Record<CallOutcome, string> = {
  NO_ANSWER: "Sem contato",
  VOICEMAIL: "Caixa postal",
  CONVERSATION_NO_PROGRESS: "Conversou · sem avanço",
  QUALIFIED_OBJECTION: "Objeção qualificada",
  CALLBACK_SCHEDULED: "Callback agendado",
  MEETING_SCHEDULED: "Reunião marcada",
  INVALID_NUMBER: "Número inválido",
  NOT_DECISION_MAKER: "Não é decisor",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function WorkQueueCard({ items }: { items: WorkQueueItem[] }) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Fila de trabalho</CardTitle>
        <Tag variant="info">precisa de outra tentativa</Tag>
      </CardHead>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          Nenhum prospect aguardando retorno agora — todas as últimas ligações
          terminaram em reunião marcada, número inválido ou não decisor.
        </p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Prospect</Th>
              <Th>Conta</Th>
              <Th>Último outcome</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item) => (
              <Tr key={item.personId}>
                <Td>
                  <Link href="/dialer" className="block">
                    <PersonAvatar
                      initials={initialsOf(item.name)}
                      name={item.name}
                      subtitle={item.role ?? undefined}
                    />
                  </Link>
                </Td>
                <Td>{item.accountName}</Td>
                <Td>
                  <Link href="/dialer">
                    <Tag>{OUTCOME_LABEL[item.lastOutcome]}</Tag>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Card>
  );
}
