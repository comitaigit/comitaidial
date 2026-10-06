import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApprovalsPageContent } from "@/features/approvals/components/ApprovalsPageContent";

export const metadata: Metadata = {
  title: "Aprovações",
};

export default function ApprovalsPage() {
  return (
    <section>
      <PageHeader
        title="Aprovações"
        subtitle="Toda ação com conteúdo redigido por IA passa por aqui antes de sair — a menos que a cadência esteja em ApprovalMode FULL."
      />
      <ApprovalsPageContent />
    </section>
  );
}
