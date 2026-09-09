"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { getMyGoal, upsertMyGoal, GoalsApiError, type Goal } from "@/features/settings/data/goals-api";

export function useGoalsForm() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const role = useSessionStore((s) => s.user?.role);
  const toast = useToast();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [callsTarget, setCallsTarget] = useState("0");
  const [conversationsTarget, setConversationsTarget] = useState("0");
  const [dialingMinutesTarget, setDialingMinutesTarget] = useState("0");
  const [conversationMinutesTarget, setConversationMinutesTarget] = useState("0");
  const [connectedCallsTarget, setConnectedCallsTarget] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getMyGoal(accessToken, "WEEKLY")
      .then((g) => {
        setGoal(g);
        if (g) {
          setCallsTarget(String(g.callsTarget));
          setConversationsTarget(String(g.conversationsTarget));
          setDialingMinutesTarget(String(g.dialingMinutesTarget));
          setConversationMinutesTarget(String(g.conversationMinutesTarget));
          setConnectedCallsTarget(String(g.connectedCallsTarget));
        }
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, [accessToken]);

  const isLockedByManager = goal?.setByRole === "ADMIN" && role !== "ADMIN";

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await upsertMyGoal(accessToken, {
        period: "WEEKLY",
        callsTarget: Number(callsTarget) || 0,
        conversationsTarget: Number(conversationsTarget) || 0,
        dialingMinutesTarget: Number(dialingMinutesTarget) || 0,
        conversationMinutesTarget: Number(conversationMinutesTarget) || 0,
        connectedCallsTarget: Number(connectedCallsTarget) || 0,
      });
      setGoal(updated);
      toast("Meta semanal salva.");
    } catch (err) {
      toast(err instanceof GoalsApiError ? err.message : "Não foi possível salvar a meta.");
    } finally {
      setSaving(false);
    }
  }

  return {
    isLoading: status === "loading" || status === "idle",
    isLockedByManager,
    callsTarget,
    setCallsTarget,
    conversationsTarget,
    setConversationsTarget,
    dialingMinutesTarget,
    setDialingMinutesTarget,
    conversationMinutesTarget,
    setConversationMinutesTarget,
    connectedCallsTarget,
    setConnectedCallsTarget,
    saving,
    save,
  };
}
