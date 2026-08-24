"use client";

import { PeriodFilter } from "@/features/funnel/components/PeriodFilter";
import { FunnelChart } from "@/features/funnel/components/FunnelChart";
import { useFunnelPage } from "@/features/funnel/hooks/useFunnelPage";

export function FunnelPageContent() {
  const { period, setPeriod, funnel, isLoading, error } = useFunnelPage();

  return (
    <section>
      <PeriodFilter value={period} onChange={setPeriod} />

      {error ? (
        <p className="mt-3.5 text-sm text-bad">{error}</p>
      ) : isLoading || !funnel ? (
        <p className="mt-3.5 text-sm text-muted">Carregando funil…</p>
      ) : (
        <div className="mt-3.5">
          <FunnelChart funnel={funnel} />
        </div>
      )}
    </section>
  );
}
