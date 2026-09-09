import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Bar } from "@/components/ui/Bar";
import type { GoalReportRow } from "@/features/kpi-targets/data/goals-api";

function MetricCell({ realized, target }: { realized: number; target: number | undefined }) {
  return (
    <div className="min-w-[90px]">
      <div className="text-sm">
        {realized}
        {target !== undefined ? <span className="text-muted"> / {target}</span> : null}
      </div>
      {target !== undefined && target > 0 ? (
        <div className="mt-1">
          <Bar percent={(realized / target) * 100} />
        </div>
      ) : null}
    </div>
  );
}

export function ReportTable({ rows }: { rows: GoalReportRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <p className="p-4 text-sm text-muted">Nenhum dado para os filtros selecionados.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Usuário</Th>
            <Th>Chamadas</Th>
            <Th>Conversas</Th>
            <Th>Tempo discando (min)</Th>
            <Th>Tempo em conversas (min)</Th>
            <Th>Conexões</Th>
            <Th>Connect rate</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.userId}>
              <Td>{row.userName}</Td>
              <Td>
                <MetricCell realized={row.realized.calls} target={row.target?.callsTarget} />
              </Td>
              <Td>
                <MetricCell
                  realized={row.realized.conversations}
                  target={row.target?.conversationsTarget}
                />
              </Td>
              <Td>
                <MetricCell
                  realized={row.realized.dialingMinutes}
                  target={row.target?.dialingMinutesTarget}
                />
              </Td>
              <Td>
                <MetricCell
                  realized={row.realized.conversationMinutes}
                  target={row.target?.conversationMinutesTarget}
                />
              </Td>
              <Td>
                <MetricCell
                  realized={row.realized.connectedCalls}
                  target={row.target?.connectedCallsTarget}
                />
              </Td>
              <Td>{(row.realized.connectRate * 100).toFixed(0)}%</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
