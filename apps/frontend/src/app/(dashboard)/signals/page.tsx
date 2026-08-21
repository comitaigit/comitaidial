import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SignalsPageContent } from "@/features/signals/components/SignalsPageContent";

export const metadata: Metadata = {
  title: "Sinais",
};

// Client-fetched — see calls/page.tsx's comment: /signals also requires the
// Bearer access token, which only lives in the client-side session store.
export default function SignalsPage() {
  return (
    <section>
      <PageHeader
        title="Sinais"
        subtitle="Sinais de engajamento gerados automaticamente a partir das ligações. Sinais de Company/People via busca pública + LLM chegam em uma próxima etapa."
      />
      <SignalsPageContent />
    </section>
  );
}
