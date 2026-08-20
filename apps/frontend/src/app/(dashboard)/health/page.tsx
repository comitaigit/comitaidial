import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { getHealth } from "@/features/health/data/health";
import { ChannelHealthPanel } from "@/features/health/components/ChannelHealthPanel";

export const metadata: Metadata = {
  title: "Saúde dos canais",
};

export default async function HealthPage() {
  const { channels, riskEvents } = await getHealth();

  return (
    <section>
      <PageHeader
        title="Saúde dos canais"
        subtitle="Abandono, limites e integrações como métricas de primeira classe."
        actions={<Button>Atualizar status</Button>}
      />

      <div className="grid gap-3.5 lg:grid-cols-3">
        {channels.map((channel) => (
          <ChannelHealthPanel key={channel.name} channel={channel} />
        ))}
      </div>

      <Card className="mt-3.5">
        <CardHead>
          <CardTitle>Eventos de risco</CardTitle>
        </CardHead>
        <Table>
          <Thead>
            <Tr>
              <Th>Hora</Th>
              <Th>Canal</Th>
              <Th>Evento</Th>
              <Th>Ação</Th>
            </Tr>
          </Thead>
          <Tbody>
            {riskEvents.map((event) => (
              <Tr key={event.time}>
                <Td>{event.time}</Td>
                <Td>{event.channel}</Td>
                <Td>{event.event}</Td>
                <Td>{event.action}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </section>
  );
}
