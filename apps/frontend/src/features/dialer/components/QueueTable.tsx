"use client";

import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { useQueueDragAndDrop } from "@/features/dialer/hooks/useQueueDragAndDrop";
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
  currentPersonId,
  dialingPersonIds,
  onReorder,
}: {
  queue: QueueItem[];
  currentStatusLabel: string;
  currentPersonId: string | null;
  dialingPersonIds: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const { dragIndex, overIndex, handleDragStart, handleDragOver, handleDrop, handleDragEnd } =
    useQueueDragAndDrop(onReorder);

  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Status</Th>
            <Th>Nome</Th>
            <Th>Telefone</Th>
            <Th>Persona</Th>
            <Th>Job Title</Th>
            <Th>Nome da empresa</Th>
            <Th>Últimas atividades</Th>
            <Th>Prioridade</Th>
          </Tr>
        </Thead>
        <Tbody>
          {queue.map((item, index) => {
            const isDialing = dialingPersonIds.includes(item.personId);
            const isCurrent = item.personId === currentPersonId && !isDialing;
            const reorderable = index > 0 && !isDialing && !isCurrent;
            return (
              <Tr
                key={item.personId}
                draggable={reorderable}
                onDragStart={reorderable ? () => handleDragStart(index) : undefined}
                onDragOver={reorderable ? (e) => handleDragOver(index, e) : undefined}
                onDrop={reorderable ? () => handleDrop(index) : undefined}
                onDragEnd={reorderable ? handleDragEnd : undefined}
                className={cn(
                  reorderable && "cursor-grab active:cursor-grabbing",
                  reorderable && dragIndex === index && "opacity-40",
                  reorderable &&
                    overIndex === index &&
                    dragIndex !== index &&
                    "border-t-2 border-t-accent",
                )}
              >
                <Td>
                  <Tag variant={isDialing || isCurrent ? "info" : "default"}>
                    {isDialing ? "Discando" : isCurrent ? currentStatusLabel : "Pendente"}
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
            );
          })}
        </Tbody>
      </Table>
    </Card>
  );
}
