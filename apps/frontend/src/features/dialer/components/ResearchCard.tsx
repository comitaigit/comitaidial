import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { AccountResearch } from "@/features/dialer/data/dialer-api";

export function ResearchCard({
  research,
  status,
  error,
}: {
  research: AccountResearch | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}) {
  if (status === "idle") {
    return (
      <Card>
        <CardBody>
          <p className="text-xs text-muted">
            A pesquisa aparece aqui assim que a ligação conectar.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-xs text-muted">Gerando pesquisa da conta…</p>
        </CardBody>
      </Card>
    );
  }

  if (status === "error" || !research) {
    return (
      <Card>
        <CardBody>
          <p className="text-xs text-bad">{error ?? "Não foi possível gerar a pesquisa."}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHead>
        <CardTitle>Pesquisa da conta</CardTitle>
        <Tag variant="ok">cacheada</Tag>
      </CardHead>
      <CardBody className="grid gap-2.5">
        <section>
          <b className="mb-1 block text-[11px]">O que a empresa faz</b>
          <p className="text-xs leading-relaxed">{research.companyOverview}</p>
        </section>
        <section>
          <b className="mb-1 block text-[11px]">Por que esse cargo importa</b>
          <p className="text-xs leading-relaxed">{research.roleImportance}</p>
        </section>
        <section>
          <b className="mb-1 block text-[11px]">Indicadores do cargo</b>
          <p className="text-xs leading-relaxed">{research.roleIndicators}</p>
        </section>
        {research.callScript ? (
          <section className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5">
            <b className="mb-1 block text-[11px]">AI Call Script</b>
            <p className="text-xs leading-relaxed">{research.callScript}</p>
          </section>
        ) : null}
        {research.objections.length > 0 ? (
          <section>
            <b className="mb-1.5 block text-[11px]">Objeções prováveis</b>
            <div className="grid gap-2">
              {research.objections.map((item) => (
                <div
                  key={item.objection}
                  className="rounded-[9px] border border-dashed border-[#cbd1da] bg-[#fbfcfd] p-2.5"
                >
                  <p className="text-xs leading-relaxed">{item.objection}</p>
                  <div className="mt-1.5 text-[10px] text-[#52606d]">{item.response}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {research.battlecards.length > 0 ? (
          <section>
            <b className="mb-1.5 block text-[11px]">Battlecards</b>
            <div className="grid gap-2">
              {research.battlecards.map((card) => (
                <div
                  key={card.competitor}
                  className="rounded-[9px] border border-dashed border-[#cbd1da] bg-[#fbfcfd] p-2.5"
                >
                  <b className="text-[11px]">{card.competitor}</b>
                  <p className="mt-1 text-xs leading-relaxed">
                    <span className="text-muted">Ponto forte deles:</span> {card.theirStrength}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    <span className="text-muted">Diferencial Comitai:</span> {card.ourEdge}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}
