"use client";

import { useState } from "react";
import type { Thread } from "@/features/inbox/data/inbox";
import { useToast } from "@/features/shell/hooks/useToast";

export function useInboxWorkspace(initialThreads: Thread[]) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState(initialThreads[0]?.id);
  const [channel, setChannel] = useState("WhatsApp");
  const [draft, setDraft] = useState("");
  const toast = useToast();

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  function selectThread(id: string) {
    setActiveId(id);
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || !active) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                { author: "me" as const, text, meta: `${channel} · agora` },
              ],
            }
          : t
      )
    );
    setDraft("");
    toast(`Mensagem enviada manualmente via ${channel} (simulação).`);
  }

  function createCallback() {
    toast("Callback criado para quinta-feira às 14h (simulação).");
  }

  function handleDraftKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  return {
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
  };
}
