import Link from "next/link";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import type { TaskListItem } from "@/features/overview/data/overview-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskListCard({
  tasks,
  isLoading,
  error,
}: {
  tasks: TaskListItem[];
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Tarefas</CardTitle>
      </CardHead>
      {error ? (
        <p className="p-4 text-sm text-bad">{error}</p>
      ) : isLoading ? (
        <p className="p-4 text-sm text-muted">Carregando tarefas…</p>
      ) : tasks.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          Nenhuma tarefa pendente — tarefas aparecem aqui quando um outcome &ldquo;Solicitou
          retorno&rdquo; é registrado no Dialer.
        </p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Empresa</Th>
              <Th>Prospect</Th>
              <Th>Data</Th>
              <Th>Resumo</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {tasks.map((task) => (
              <Tr key={task.id}>
                <Td>{task.companyName}</Td>
                <Td>{task.prospectName}</Td>
                <Td>{formatDate(task.dueAt)}</Td>
                <Td>{task.summary ?? "Gerando resumo…"}</Td>
                <Td>
                  <Link href="/dialer">
                    <Button size="small" variant="primary">
                      Executar chamada
                    </Button>
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
