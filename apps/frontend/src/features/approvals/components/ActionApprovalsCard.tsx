"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { PendingAction } from "@/features/approvals/data/approvals-api";

const TYPE_LABEL: Record<string, string> = {
  SEND_EMAIL: "E-mail",
  LINKEDIN_CONNECT: "Conexão no LinkedIn",
  LINKEDIN_MESSAGE: "Mensagem no LinkedIn",
  ENRICH: "Enriquecimento",
};

function contentPreview(action: PendingAction): string {
  const payload = action.payload;
  if (typeof payload.subject === "string" || typeof payload.body === "string") {
    return [payload.subject, payload.body].filter(Boolean).join(" — ");
  }
  if (typeof payload.note === "string") return payload.note;
  return JSON.stringify(payload);
}

export function ActionApprovalsCard({
  actions,
  busyId,
  onApprove,
  onReject,
}: {
  actions: PendingAction[];
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Ações da Play Engine aguardando aprovação</CardTitle>
        <Tag>{actions.length}</Tag>
      </CardHead>
      <CardBody className="grid gap-2.5">
        {actions.length === 0 ? (
          <p className="text-xs text-muted">
            Nenhuma ação de IA aguardando aprovação no momento.
          </p>
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
              <p className="text-xs text-muted">{contentPreview(action)}</p>
              <div className="flex gap-1.5">
                <Button
                  size="small"
                  variant="primary"
                  disabled={busyId === action.id}
                  onClick={() => onApprove(action.id)}
                >
                  Aprovar
                </Button>
                <Button
                  size="small"
                  variant="bad"
                  disabled={busyId === action.id}
                  onClick={() => onReject(action.id)}
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
