"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useApprovalsStore } from "@/features/approvals/stores/approvals-store";
import {
  approveAction,
  rejectAction,
  approveProposal,
  rejectProposal,
  completeLinkedInAction,
  skipLinkedInAction,
} from "@/features/approvals/data/approvals-api";

export function useApprovalsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const {
    actions,
    proposals,
    linkedinActions,
    status,
    error,
    fetchAll,
    removeAction,
    removeProposal,
    removeLinkedInAction,
  } = useApprovalsStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) fetchAll(accessToken);
  }, [accessToken, fetchAll]);

  async function runAction(id: string, fn: () => Promise<unknown>, onSuccess: () => void, okMsg: string) {
    if (!accessToken || busyId) return;
    setBusyId(id);
    try {
      await fn();
      onSuccess();
      toast(okMsg);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setBusyId(null);
    }
  }

  return {
    actions,
    proposals,
    linkedinActions,
    isLoading: status === "loading" || status === "idle",
    error,
    busyId,
    approveAction: (id: string) =>
      runAction(id, () => approveAction(id, accessToken!), () => removeAction(id), "Ação aprovada."),
    rejectAction: (id: string) =>
      runAction(id, () => rejectAction(id, accessToken!), () => removeAction(id), "Ação rejeitada."),
    approveProposal: (id: string) =>
      runAction(
        id,
        () => approveProposal(id, accessToken!),
        () => removeProposal(id),
        "Proposta aprovada e executada.",
      ),
    rejectProposal: (id: string) =>
      runAction(
        id,
        () => rejectProposal(id, accessToken!),
        () => removeProposal(id),
        "Proposta rejeitada.",
      ),
    completeLinkedInAction: (id: string) =>
      runAction(
        id,
        () => completeLinkedInAction(id, accessToken!),
        () => removeLinkedInAction(id),
        "Marcada como feita.",
      ),
    skipLinkedInAction: (id: string) =>
      runAction(
        id,
        () => skipLinkedInAction(id, accessToken!),
        () => removeLinkedInAction(id),
        "Ação pulada.",
      ),
  };
}
