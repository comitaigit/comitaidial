import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SequencesPageContent } from "@/features/sequences/components/SequencesPageContent";
import { NewSequenceButton } from "@/features/sequences/components/NewSequenceButton";

export const metadata: Metadata = {
  title: "Cadências",
};

// Client-fetched — see accounts/page.tsx's comment: /cadences also requires
// the Bearer access token, which only lives in the client-side session store.
export default function SequencesPage() {
  return (
    <section>
      <PageHeader
        title="Cadências"
        subtitle="Baixa fidelidade: gestão de tentativas e remoção imediata quando há resposta."
        actions={<NewSequenceButton />}
      />
      <SequencesPageContent />
    </section>
  );
}
