import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { Call, CallOutcome } from "@/features/calls/data/calls-api";

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

const OUTCOME_VARIANT: Record<CallOutcome, "ok" | "warn" | "bad" | "info" | "default"> = {
  VOICEMAIL: "default",
  WRONG_PERSON: "bad",
  BUSY: "default",
  NO_ANSWER: "default",
  INVALID_NUMBER: "bad",
  CALLBACK_REQUESTED: "info",
  MEETING_SCHEDULED: "ok",
  NOT_INTERESTED: "warn",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CallsTable({ calls }: { calls: Call[] }) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Quando</Th>
            <Th>Prospect</Th>
            <Th>Número</Th>
            <Th>Duração</Th>
            <Th>Conversa?</Th>
            <Th>Outcome</Th>
          </Tr>
        </Thead>
        <Tbody>
          {calls.map((call) => (
            <Tr key={call.id}>
              <Td>{formatWhen(call.createdAt)}</Td>
              <Td>{call.person?.name ?? "—"}</Td>
              <Td>{call.toNumber}</Td>
              <Td>{formatDuration(call.durationSeconds)}</Td>
              <Td>
                <Tag variant={call.isConversation ? "ok" : "default"}>
                  {call.isConversation ? "Sim" : "Não"}
                </Tag>
              </Td>
              <Td>
                {call.outcome ? (
                  <Tag variant={OUTCOME_VARIANT[call.outcome]}>
                    {OUTCOME_LABEL[call.outcome]}
                  </Tag>
                ) : (
                  "—"
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
