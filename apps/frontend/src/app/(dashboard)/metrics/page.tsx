import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiTargetsPageContent } from "@/features/kpi-targets/components/KpiTargetsPageContent";

export const metadata: Metadata = {
  title: "KPI Targets",
};

// Client-fetched — see accounts/page.tsx's comment: /goals/report also
// requires the Bearer access token, which only lives in the client-side
// session store.
export default function KpiTargetsPage() {
  return (
    <section>
      <PageHeader
        title="KPI Targets"
        subtitle="Realizado vs. meta por usuário. Visível para todo o time, sem restrição."
      />
      <KpiTargetsPageContent />
    </section>
  );
}
