"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/features/overview/components/KpiCard";
import { WorkQueueCard } from "@/features/overview/components/WorkQueueCard";
import { InsightPill } from "@/features/overview/components/InsightPill";
import { useOverviewPage } from "@/features/overview/hooks/useOverviewPage";

export function OverviewPageContent() {
  const {
    bdrName,
    kpis,
    workQueue,
    isSummaryLoading,
    summaryError,
    insight,
    isInsightLoading,
    insightError,
  } = useOverviewPage();

  return (
    <section>
      <PageHeader
        title={bdrName ? `Hoje, ${bdrName}` : "Hoje"}
        subtitle="Seu foco é gerar mais conversas reais a partir das ligações do Dialer."
        actions={
          <Link href="/dialer">
            <Button variant="primary">Ir para o Dialer</Button>
          </Link>
        }
      />

      <InsightPill insight={insight} isLoading={isInsightLoading} error={insightError} />

      {summaryError ? (
        <p className="mt-3.5 text-sm text-bad">{summaryError}</p>
      ) : isSummaryLoading ? (
        <p className="mt-3.5 text-sm text-muted">Carregando dados de hoje…</p>
      ) : (
        <>
          <div className="mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
            <KpiCard label="Conversas reais hoje" value={kpis?.conversationsToday ?? 0} />
            <KpiCard label="Tentativas hoje" value={kpis?.attemptsToday ?? 0} />
            <KpiCard label="Sinais de engajamento hoje" value={kpis?.signalsToday ?? 0} />
          </div>

          <div className="mt-3.5">
            <WorkQueueCard items={workQueue} />
          </div>
        </>
      )}
    </section>
  );
}
