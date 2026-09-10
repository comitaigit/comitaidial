"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { PendingAction } from "@/features/approvals/data/approvals-api";

const TYPE_LABEL: Record<string, string> = {
  LINKEDIN_CONNECT: "Pedido de conexão",
  LINKEDIN_MESSAGE: "Mensagem",
};

export function LinkedInActionsCard({
  actions,
  busyId,
  onComplete,
  onSkip,
}: {
  actions: PendingAction[];
  busyId: string | null;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Fila de ações no LinkedIn</CardTitle>
        <Tag>{actions.length}</Tag>
      </CardHead>
      <CardBody className="grid gap-2.5">
        <p className="text-[11px] text-muted">
          O Comitai nunca clica no LinkedIn por você. Abra o perfil, faça a ação
          manualmente e depois confirme aqui.
        </p>
        {actions.length === 0 ? (
          <p className="text-xs text-muted">Nenhuma ação de LinkedIn pendente.</p>
        ) : (
          actions.map((action) => (
            <div
              key={action.id}
              className="grid gap-1.5 rounded-[9px] border border-line bg-panel p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <b className="text-[13px]">{action.person.name}</b>
                <Tag variant="info">{TYPE_LABEL[action.type] ?? action.type}</Tag>
              </div>
              {typeof action.payload.note === "string" && (
                <p className="text-xs text-muted">{action.payload.note}</p>
              )}
              {action.person.linkedinUrl && (
                <a
                  href={action.person.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  Abrir perfil no LinkedIn
                </a>
              )}
              <div className="flex gap-1.5">
                <Button
                  size="small"
                  variant="primary"
                  disabled={busyId === action.id}
                  onClick={() => onComplete(action.id)}
                >
                  Feito
                </Button>
                <Button
                  size="small"
                  disabled={busyId === action.id}
                  onClick={() => onSkip(action.id)}
                >
                  Pular
                </Button>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
