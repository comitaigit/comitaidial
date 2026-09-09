import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { FunnelPageContent } from "@/features/funnel/components/FunnelPageContent";

export const metadata: Metadata = {
  title: "Meu Funil",
};

// Client-fetched — see accounts/page.tsx's comment: /overview/funnel also
// requires the Bearer access token, which only lives in the client-side
// session store.
export default function FunnelPage() {
  return (
    <section>
      <PageHeader
        title="Meu Funil"
        subtitle="Tentativas → Conectadas → Conversas → Reuniões agendadas, para as suas próprias ligações."
      />
      <FunnelPageContent />
    </section>
  );
}
