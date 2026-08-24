"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/features/overview/components/KpiCard";
import { WindowFilter } from "@/features/overview/components/WindowFilter";
import { ContentPillCard } from "@/features/overview/components/ContentPillCard";
import { TaskListCard } from "@/features/overview/components/TaskListCard";
import { useOverviewPage } from "@/features/overview/hooks/useOverviewPage";

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function OverviewPageContent() {
  const {
    bdrName,
    windowDays,
    changeWindow,
    kpis,
    isKpisLoading,
    kpisError,
    pill,
    isPillLoading,
    pillError,
    tasks,
    isTasksLoading,
    tasksError,
  } = useOverviewPage();

  return (
    <section>
      <PageHeader
        title={bdrName ? `Visão geral, ${bdrName}` : "Visão geral"}
        subtitle="Seu foco é gerar mais conversas reais a partir das ligações do Dialer."
        actions={
          <Link href="/dialer">
            <Button variant="primary">Ir para o Dialer</Button>
          </Link>
        }
      />

      <WindowFilter value={windowDays} onChange={changeWindow} />

      {kpisError ? (
        <p className="mt-3.5 text-sm text-bad">{kpisError}</p>
      ) : isKpisLoading ? (
        <p className="mt-3.5 text-sm text-muted">Carregando KPIs…</p>
      ) : (
        <div className="mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
          <KpiCard label="Tentativas" value={kpis?.attempts ?? 0} />
          <KpiCard label="Conectadas" value={kpis?.connected ?? 0} />
          <KpiCard label="Conversas reais" value={kpis?.conversations ?? 0} />
          <KpiCard label="Reuniões agendadas" value={kpis?.meetingsScheduled ?? 0} />
          <KpiCard label="Connect rate" value={kpis ? pct(kpis.connectRate) : "0%"} />
          <KpiCard label="Conversation rate" value={kpis ? pct(kpis.conversationRate) : "0%"} />
        </div>
      )}

      <div className="mt-3.5">
        <ContentPillCard pill={pill} isLoading={isPillLoading} error={pillError} />
      </div>

      <div className="mt-3.5">
        <TaskListCard tasks={tasks} isLoading={isTasksLoading} error={tasksError} />
      </div>
    </section>
  );
}
