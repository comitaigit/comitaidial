"use client";

import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAssistantWorkspace } from "@/features/assistant/hooks/useAssistantWorkspace";

const PROPOSAL_TYPE_LABEL: Record<string, string> = {
  ENROLL_IN_CADENCE: "Inscrever em cadência",
  SEND_EMAIL: "Enviar e-mail",
  ENRICH_PERSON: "Enriquecer contato",
};

export function AssistantWorkspace() {
  const {
    conversations,
    activeConversation,
    isLoadingList,
    isLoadingConversation,
    sending,
    draft,
    setDraft,
    selectConversation,
    startNewConversation,
    submit,
    handleDraftKeyDown,
    busyProposalId,
    approve,
    reject,
  } = useAssistantWorkspace();

  return (
    <Card className="grid min-h-150 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="border-b border-line bg-[#fbfcfd] md:border-b-0 md:border-r">
        <CardHead>
          <CardTitle level={3}>Conversas</CardTitle>
          <Button size="small" onClick={startNewConversation}>
            + Nova
          </Button>
        </CardHead>
        {isLoadingList ? (
          <p className="p-3 text-xs text-muted">Carregando…</p>
        ) : conversations.length === 0 ? (
          <p className="p-3 text-xs text-muted">Nenhuma conversa ainda.</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={cn(
                "w-full truncate border-b border-[#e8ebf0] p-3 text-left text-xs hover:bg-white",
                conversation.id === activeConversation?.id && "bg-white font-semibold",
              )}
            >
              {conversation.title}
            </button>
          ))
        )}
      </div>

      <div className="grid grid-rows-[1fr_auto]">
        <div className="flex max-h-120 min-h-80 flex-col gap-2.5 overflow-auto bg-panel p-4.5">
          {!activeConversation ? (
            <p className="text-xs text-muted">
              Pergunte sobre empresas, contatos, histórico de ligações ou créditos —
              ou peça para inscrever alguém em uma cadência, enviar um e-mail ou
              enriquecer um contato (o assistente sempre pede sua confirmação antes
              de executar).
            </p>
          ) : isLoadingConversation ? (
            <p className="text-xs text-muted">Carregando…</p>
          ) : (
            <>
              {activeConversation.messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[74%] whitespace-pre-wrap rounded-xl border border-line p-2.5 text-xs leading-relaxed",
                    message.role === "USER"
                      ? "self-end bg-[#f3f6ff]"
                      : "self-start bg-[#fafbfc]",
                  )}
                >
                  {message.text}
                </div>
              ))}
              {activeConversation.proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="self-start rounded-xl border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Tag variant="info">
                      {PROPOSAL_TYPE_LABEL[proposal.type] ?? proposal.type}
                    </Tag>
                    <Tag
                      variant={
                        proposal.status === "PENDING"
                          ? "warn"
                          : proposal.status === "EXECUTED"
                            ? "ok"
                            : proposal.status === "FAILED"
                              ? "bad"
                              : "default"
                      }
                    >
                      {proposal.status}
                    </Tag>
                  </div>
                  {proposal.status === "PENDING" && (
                    <div className="flex gap-1.5">
                      <Button
                        size="small"
                        variant="primary"
                        disabled={busyProposalId === proposal.id}
                        onClick={() => approve(proposal.id)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="small"
                        variant="bad"
                        disabled={busyProposalId === proposal.id}
                        onClick={() => reject(proposal.id)}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-line bg-[#fbfcfd] p-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Pergunte ao assistente…"
              rows={2}
              className="resize-none rounded-lg border border-line bg-panel px-2.5 py-2 text-sm outline-none focus:border-accent"
            />
            <Button variant="primary" onClick={submit} disabled={sending || !draft.trim()}>
              {sending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
