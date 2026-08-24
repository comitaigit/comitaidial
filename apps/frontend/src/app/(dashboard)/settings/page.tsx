import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { OperationForm } from "@/features/settings/components/OperationForm";
import { GoalsForm } from "@/features/settings/components/GoalsForm";

export const metadata: Metadata = {
  title: "Workspace",
};

const COMPLIANCE_NOTICES = [
  {
    title: "RLS obrigatório",
    body: "Person, Account, Interaction e canais isolados por tenant.",
  },
  {
    title: "Idempotência",
    body: "reentrega de webhook não duplica chamada ou mensagem.",
  },
  {
    title: "LGPD",
    body: "exportação, exclusão e opt-out previstos desde a V0.",
  },
  {
    title: "IA",
    body: "contexto de Account cacheado; sem LLM em loop sem teto.",
  },
];

export default function SettingsPage() {
  return (
    <section>
      <PageHeader
        title="Workspace"
        subtitle="Cadastre suas metas semanais aqui — o KPI Targets lê o que for definido nesta tela."
      />

      <div className="grid gap-3.5 lg:grid-cols-2">
        <GoalsForm />

        <OperationForm />

        <Card>
          <CardHead>
            <CardTitle>Segurança e compliance</CardTitle>
          </CardHead>
          <CardBody className="grid gap-2.5">
            {COMPLIANCE_NOTICES.map((notice) => (
              <div
                key={notice.title}
                className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed"
              >
                <b>{notice.title}:</b> {notice.body}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
