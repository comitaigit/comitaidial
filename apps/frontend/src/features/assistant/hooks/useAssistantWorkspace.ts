"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useAssistantStore } from "@/features/assistant/stores/assistant-store";
import { approveProposal, rejectProposal } from "@/features/assistant/data/assistant-api";

export function useAssistantWorkspace() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const {
    conversations,
    activeConversation,
    listStatus,
    conversationStatus,
    sending,
    fetchConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    setProposalStatus,
  } = useAssistantStore();

  useEffect(() => {
    if (accessToken) fetchConversations(accessToken);
  }, [accessToken, fetchConversations]);

  function selectConversation(id: string) {
    if (accessToken) openConversation(accessToken, id);
  }

  async function submit() {
    const text = draft.trim();
    if (!text || !accessToken || sending) return;
    setDraft("");
    try {
      await sendMessage(accessToken, text);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    }
  }

  function handleDraftKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  async function approve(id: string) {
    if (!accessToken || busyProposalId) return;
    setBusyProposalId(id);
    try {
      const result = await approveProposal(id, accessToken);
      setProposalStatus(id, result.status === "PENDING" ? "EXECUTED" : result.status);
      toast(result.status === "EXECUTED" ? "Proposta executada." : "Proposta processada.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível aprovar a proposta.");
    } finally {
      setBusyProposalId(null);
    }
  }

  async function reject(id: string) {
    if (!accessToken || busyProposalId) return;
    setBusyProposalId(id);
    try {
      await rejectProposal(id, accessToken);
      setProposalStatus(id, "REJECTED");
      toast("Proposta rejeitada.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível rejeitar a proposta.");
    } finally {
      setBusyProposalId(null);
    }
  }

  return {
    conversations,
    activeConversation,
    isLoadingList: listStatus === "loading" || listStatus === "idle",
    isLoadingConversation: conversationStatus === "loading",
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
  };
}
