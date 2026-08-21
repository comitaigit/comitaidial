import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { Call, CallOutcome } from "@/features/calls/data/calls-api";

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

const OUTCOME_VARIANT: Record<CallOutcome, "ok" | "warn" | "bad" | "info" | "default"> = {
  NO_ANSWER: "default",
  VOICEMAIL: "default",
  CONVERSATION_NO_PROGRESS: "info",
  QUALIFIED_OBJECTION: "warn",
  CALLBACK_SCHEDULED: "info",
  MEETING_SCHEDULED: "ok",
  INVALID_NUMBER: "bad",
  NOT_DECISION_MAKER: "bad",
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
