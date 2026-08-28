import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { DialerStage } from "@/features/dialer/components/DialerStage";

export const metadata: Metadata = {
  title: "Dialer",
};

// Client-fetched — see calls/page.tsx's comment: the Dialer also needs the
// Bearer access token (softphone token, prospect queue) that only lives in
// the client-side session store.
export default function DialerPage() {
  return (
    <section>
      <PageHeader
        title="Dialer"
        subtitle="Ligação em tempo real pelo navegador. Um contato por vez — toda tentativa exige classificação antes de avançar."
      />
      <DialerStage />
    </section>
  );
}
