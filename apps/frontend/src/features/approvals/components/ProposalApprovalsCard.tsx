"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { PendingProposal } from "@/features/approvals/data/approvals-api";

const TYPE_LABEL: Record<string, string> = {
  ENROLL_IN_CADENCE: "Inscrever em cadência",
  SEND_EMAIL: "Enviar e-mail",
  ENRICH_PERSON: "Enriquecer contato",
};

function payloadPreview(payload: Record<string, unknown>): string {
  if (typeof payload.subject === "string" || typeof payload.body === "string") {
    return [payload.subject, payload.body].filter(Boolean).join(" — ");
  }
  return JSON.stringify(payload);
}

export function ProposalApprovalsCard({
  proposals,
  busyId,
  onApprove,
  onReject,
}: {
  proposals: PendingProposal[];
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Propostas do Assistente</CardTitle>
        <Tag>{proposals.length}</Tag>
      </CardHead>
      <CardBody className="grid gap-2.5">
        {proposals.length === 0 ? (
          <p className="text-xs text-muted">
            Nenhuma proposta do assistente aguardando confirmação.
          </p>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="grid gap-1.5 rounded-[9px] border border-line bg-panel p-2.5"
            >
              <Tag variant="info" className="w-fit">
                {TYPE_LABEL[proposal.type] ?? proposal.type}
              </Tag>
              <p className="text-xs text-muted">{payloadPreview(proposal.payload)}</p>
              <div className="flex gap-1.5">
                <Button
                  size="small"
                  variant="primary"
                  disabled={busyId === proposal.id}
                  onClick={() => onApprove(proposal.id)}
                >
                  Confirmar
                </Button>
                <Button
                  size="small"
                  variant="bad"
                  disabled={busyId === proposal.id}
                  onClick={() => onReject(proposal.id)}
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
