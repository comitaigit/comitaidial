import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getThreads } from "@/features/inbox/data/inbox";
import { InboxWorkspace } from "@/features/inbox/components/InboxWorkspace";

export const metadata: Metadata = {
  title: "Inbox unificada",
};

export default async function InboxPage() {
  const threads = await getThreads();

  return (
    <section>
      <PageHeader
        title="Inbox unificada"
        subtitle="Conversas organizadas por pessoa, não por número ou canal."
        actions={
          <>
            <Button>Filtros</Button>
            <Button>Só não lidas</Button>
          </>
        }
      />
      <InboxWorkspace threads={threads} />
    </section>
  );
}
