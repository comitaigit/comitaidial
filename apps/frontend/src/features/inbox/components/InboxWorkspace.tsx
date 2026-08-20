"use client";

import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { cn } from "@/lib/cn";
import type { Thread } from "@/features/inbox/data/inbox";
import { useInboxWorkspace } from "@/features/inbox/hooks/useInboxWorkspace";

export function InboxWorkspace({ threads: initialThreads }: { threads: Thread[] }) {
  const {
    threads,
    active,
    channel,
    draft,
    setChannel,
    setDraft,
    selectThread,
    sendMessage,
    createCallback,
    handleDraftKeyDown,
  } = useInboxWorkspace(initialThreads);

  if (!active) return null;

  return (
    <Card className="grid min-h-150 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
      <div className="border-b border-line bg-[#fbfcfd] md:border-b-0 md:border-r">
        <CardHead>
          <CardTitle level={3}>Conversas</CardTitle>
          <Tag>{threads.length} novas</Tag>
        </CardHead>
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => selectThread(thread.id)}
            className={cn(
              "w-full border-b border-[#e8ebf0] p-3 text-left hover:bg-white",
              thread.id === active.id && "bg-white"
            )}
          >
            <div className="flex items-center justify-between">
              <PersonAvatar initials={thread.initials} name={thread.name} subtitle={thread.company} />
              <span className="text-[10px] text-[#8a93a1]">{thread.timeAgo}</span>
            </div>
            <div className="mt-1.5 truncate text-[11px] text-muted">
              {thread.preview}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-rows-[auto_1fr_auto]">
        <div className="border-b border-line p-3.5">
          <div className="flex items-center justify-between">
            <PersonAvatar
              initials={active.initials}
              name={active.name}
              subtitle={`${active.company} · ${active.role}`}
            />
            <div className="flex items-center gap-2">
              <Tag variant={active.paused ? "ok" : "info"}>
                {active.paused ? "Cadência pausada" : "Em cadência"}
              </Tag>
              <Button size="small">Ver perfil</Button>
            </div>
          </div>
        </div>

        <div className="flex max-h-120 flex-col gap-2.5 overflow-auto bg-panel p-4.5">
          {active.messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[74%] rounded-xl border border-line p-2.5 text-xs leading-relaxed",
                m.author === "me"
                  ? "self-end bg-[#f3f6ff]"
                  : "self-start bg-[#fafbfc]"
              )}
            >
              {m.text}
              <small className="mt-1.5 block text-[9px] text-muted">
                {m.meta}
              </small>
            </div>
          ))}
          <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
            <b>Sugestão detectada:</b> {active.notice}
          </div>
        </div>

        <div className="border-t border-line bg-[#fbfcfd] p-3">
          <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="rounded-lg border border-line bg-panel px-2.5 py-2 text-sm"
            >
              <option>WhatsApp</option>
              <option>LinkedIn</option>
            </select>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Escreva uma resposta manual..."
              className="rounded-lg border border-line bg-panel px-2.5 py-2 text-sm"
            />
            <Button variant="primary" onClick={sendMessage}>
              Enviar
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted">
              Nenhuma resposta automática na V0.
            </span>
            <Button size="small" onClick={createCallback}>
              + Criar callback quinta 14h
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
