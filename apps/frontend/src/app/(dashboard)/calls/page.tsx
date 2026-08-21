import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CallsPageContent } from "@/features/calls/components/CallsPageContent";

export const metadata: Metadata = {
  title: "Chamadas",
};

// Client-fetched — see accounts/page.tsx's comment: /calls also requires
// the Bearer access token, which only lives in the client-side session store.
export default function CallsPage() {
  return (
    <section>
      <PageHeader
        title="Chamadas"
        subtitle="Histórico de ligações. Transcrição e AI sales coach chegam quando a gravação/transcrição do Twilio estiver conectada."
      />
      <CallsPageContent />
    </section>
  );
}
