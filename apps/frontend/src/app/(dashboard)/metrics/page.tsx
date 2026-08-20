import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getMetrics } from "@/features/metrics/data/metrics";
import { KpiCard } from "@/features/overview/components/KpiCard";
import { ConversationsChart } from "@/features/metrics/components/ConversationsChart";
import { GuardrailsCard } from "@/features/metrics/components/GuardrailsCard";

export const metadata: Metadata = {
  title: "Performance",
};

export default async function MetricsPage() {
  const data = await getMetrics();

  return (
    <section>
      <PageHeader
        title="Performance"
        subtitle="Métrica principal: conversas humanas por BDR por dia."
        actions={
          <>
            <Button>Últimos 14 dias</Button>
            <Button>Por BDR</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard label="Conversas / dia" value={data.kpis.conversationsPerDay} delta="Baseline 12,9" />
        <KpiCard label="Tentativas / dia" value={data.kpis.attemptsPerDay} delta="Baseline 54" />
        <KpiCard
          label="Conversa → reunião"
          value={data.kpis.conversationToMeeting}
          delta="−7% relativo"
          bad
        />
        <KpiCard label="Custo / conversa" value={data.kpis.costPerConversation} delta="−18%" />
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <ConversationsChart baseline={data.chart.baseline} current={data.chart.current} />
        <GuardrailsCard guardrails={data.guardrails} />
      </div>
    </section>
  );
}
