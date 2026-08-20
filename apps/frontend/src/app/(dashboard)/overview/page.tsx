import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getOverviewData } from "@/features/overview/data/overview";
import { KpiCard } from "@/features/overview/components/KpiCard";
import { WorkQueueCard } from "@/features/overview/components/WorkQueueCard";
import { ChannelHealthCard } from "@/features/overview/components/ChannelHealthCard";

export const metadata: Metadata = {
  title: "Visão geral",
};

export default async function OverviewPage() {
  const data = await getOverviewData();

  return (
    <section>
      <PageHeader
        title={`Hoje, ${data.bdrName}`}
        subtitle="Seu foco é gerar mais conversas sem perder contexto entre telefone, WhatsApp e LinkedIn."
        actions={
          <>
            <span className="rounded-md border border-dashed border-[#aeb4bf] px-1.5 py-1 text-[10px] text-[#7d8490]">
              PROTÓTIPO LOW-FI
            </span>
            <Link href="/dialer">
              <Button variant="primary">Iniciar bloco de discagem</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard
          label="Conversas humanas"
          value={data.kpis.conversations}
          delta="+38% vs baseline"
        />
        <KpiCard
          label="Tentativas"
          value={data.kpis.attempts}
          delta="+21 hoje"
        />
        <KpiCard
          label="Custo / conversa"
          value={data.kpis.costPerConversation}
          delta="-18% vs baseline"
        />
        <KpiCard
          label="Abandono"
          value={data.kpis.abandonment}
          delta="Meta interna < 3%"
          bad
        />
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.35fr_0.9fr]">
        <WorkQueueCard items={data.workQueue} />
        <ChannelHealthCard channels={data.channelHealth} />
      </div>
    </section>
  );
}
