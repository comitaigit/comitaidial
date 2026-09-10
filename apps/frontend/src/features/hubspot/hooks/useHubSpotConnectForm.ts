"use client";

import { useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useHubSpotStore } from "@/features/hubspot/stores/hubspot-store";
import { connectHubSpot } from "@/features/hubspot/data/hubspot-api";

export function useHubSpotConnectForm() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const setHubSpotStatus = useHubSpotStore((s) => s.setHubSpotStatus);

  const canSubmit = token.trim().length >= 10 && !submitting;

  async function submit() {
    if (!accessToken || !canSubmit) return;
    setSubmitting(true);
    try {
      await connectHubSpot(token.trim(), accessToken);
      setHubSpotStatus({ connected: true });
      toast("HubSpot conectado.");
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível conectar o HubSpot.");
    } finally {
      setSubmitting(false);
    }
  }

  return { token, setToken, submitting, canSubmit, submit };
}
