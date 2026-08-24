import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { CallAnalysisButton } from "@/features/calls/components/CallAnalysisButton";
import type { AccountPriority, Call, CallOutcome } from "@/features/calls/data/calls-api";

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

const PRIORITY_LABEL: Record<AccountPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const PRIORITY_VARIANT: Record<AccountPriority, "bad" | "warn" | "default"> = {
  HIGH: "bad",
  MEDIUM: "warn",
  LOW: "default",
};

// Status column, derived rather than stored — the Dial spec's three states
// map onto fields we already have: outcome for "Agendado", isConversation
// (>=30s connected) for "Conectada", everything else "Não conectada".
function callStatus(call: Call): { label: string; variant: "ok" | "info" | "default" } {
  if (call.outcome === "MEETING_SCHEDULED") return { label: "Agendado", variant: "info" };
  if (call.isConversation) return { label: "Conectada", variant: "ok" };
  return { label: "Não conectada", variant: "default" };
}

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
            <Th>Usuário</Th>
            <Th>Prospect</Th>
            <Th>Empresa</Th>
            <Th>Prioridade</Th>
            <Th>Número</Th>
            <Th>Duração</Th>
            <Th>Status</Th>
            <Th>Outcome</Th>
            <Th>Análise</Th>
          </Tr>
        </Thead>
        <Tbody>
          {calls.map((call) => {
            const status = callStatus(call);
            const priority = call.person?.account?.priority ?? null;
            return (
              <Tr key={call.id}>
                <Td>{formatWhen(call.createdAt)}</Td>
                <Td>{call.user?.name ?? "—"}</Td>
                <Td>{call.person?.name ?? "—"}</Td>
                <Td>{call.person?.account?.name ?? "—"}</Td>
                <Td>
                  {priority ? (
                    <Tag variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Tag>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>{call.toNumber}</Td>
                <Td>{formatDuration(call.durationSeconds)}</Td>
                <Td>
                  <Tag variant={status.variant}>{status.label}</Tag>
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
                <Td>
                  <CallAnalysisButton call={call} />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Card>
  );
}
