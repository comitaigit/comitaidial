import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CallsPageContent } from "@/features/calls/components/CallsPageContent";

export const metadata: Metadata = {
  title: "Call Check",
};

// Client-fetched — see accounts/page.tsx's comment: /calls also requires
// the Bearer access token, which only lives in the client-side session store.
export default function CallsPage() {
  return (
    <section>
      <PageHeader
        title="Call Check"
        subtitle="Histórico de ligações com transcrição e AI Sales Coach. Análise da IA aparece a partir de 1 minuto de conversa conectada."
      />
      <CallsPageContent />
    </section>
  );
}
