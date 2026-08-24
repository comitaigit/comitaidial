import Link from "next/link";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { CallOutcome, WorkQueueItem } from "@/features/overview/data/overview-api";

const OUTCOME_LABEL: Record<CallOutcome, string> = {
  VOICEMAIL: "Caixa postal",
  WRONG_PERSON: "Pessoa errada",
  BUSY: "Ocupado",
  NO_ANSWER: "Não atendeu",
  INVALID_NUMBER: "Não existe",
  CALLBACK_REQUESTED: "Solicitou retorno",
  MEETING_SCHEDULED: "Agendado",
  NOT_INTERESTED: "Sem interesse",
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
          terminaram em agendado, pessoa errada, sem interesse ou não existe.
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
