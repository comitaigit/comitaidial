import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { ContentPill } from "@/features/overview/data/overview-api";

export function ContentPillCard({
  pill,
  isLoading,
  error,
}: {
  pill: ContentPill | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>O que priorizar</CardTitle>
        <span aria-hidden>✨</span>
      </CardHead>
      <div className="p-4">
        {error ? (
          <p className="text-sm text-bad">Não foi possível gerar a análise agora.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted">Analisando conversas da janela selecionada…</p>
        ) : !pill || !pill.ready ? (
          <p className="text-sm text-muted">
            Ainda não há chamadas classificadas suficientes nesta janela
            {pill ? ` (${pill.classifiedCount}/10)` : ""} para gerar uma análise. Continue
            classificando as ligações no Dialer.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Tag variant="bad">Top dores</Tag>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {pill.painPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <Tag variant="warn">Top objeções</Tag>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {pill.objections.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <Tag variant="info">Priorize</Tag>
              <p className="mt-2 text-sm">{pill.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
