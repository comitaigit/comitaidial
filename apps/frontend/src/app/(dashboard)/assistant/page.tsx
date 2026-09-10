import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssistantWorkspace } from "@/features/assistant/components/AssistantWorkspace";

export const metadata: Metadata = {
  title: "Assistente IA",
};

export default function AssistantPage() {
  return (
    <section>
      <PageHeader
        title="Assistente IA"
        subtitle="Pergunte sobre contas, contatos e créditos, ou peça uma ação — toda proposta de ação aguarda sua confirmação."
      />
      <AssistantWorkspace />
    </section>
  );
}
