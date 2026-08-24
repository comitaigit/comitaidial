import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type {
  AccountPriority,
  InfluenceLevel,
  QueueItem,
} from "@/features/dialer/data/dialer-api";

const PERSONA_LABEL: Record<InfluenceLevel, string> = {
  FINANCIAL_DECISION_MAKER: "Decisor financeiro",
  DIRECT_INFLUENCER: "Influenciador direto",
  OPERATIONAL_DECISION_MAKER: "Decisor operacional",
  INDIRECT_INFLUENCER: "Influenciador indireto",
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

export function QueueTable({
  queue,
  currentStatusLabel,
}: {
  queue: QueueItem[];
  currentStatusLabel: string;
}) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Status</Th>
            <Th>Nome</Th>
            <Th>Telefone</Th>
            <Th>Persona</Th>
            <Th>Cargo</Th>
            <Th>Nome da empresa</Th>
            <Th>Últimas atividades</Th>
            <Th>Prioridade</Th>
          </Tr>
        </Thead>
        <Tbody>
          {queue.map((item, index) => (
            <Tr key={item.personId}>
              <Td>
                <Tag variant={index === 0 ? "info" : "default"}>
                  {index === 0 ? currentStatusLabel : "Pendente"}
                </Tag>
              </Td>
              <Td>{item.name}</Td>
              <Td>{item.phone}</Td>
              <Td>{item.persona ? PERSONA_LABEL[item.persona] : "—"}</Td>
              <Td>{item.role ?? "—"}</Td>
              <Td>{item.accountName}</Td>
              <Td>{item.lastActivity ?? "—"}</Td>
              <Td>
                {item.priority ? (
                  <Tag variant={PRIORITY_VARIANT[item.priority]}>
                    {PRIORITY_LABEL[item.priority]}
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
