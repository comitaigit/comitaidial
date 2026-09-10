"use client";

import { useEffect } from "react";
import { openModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useHubSpotStore } from "@/features/hubspot/stores/hubspot-store";
import { HubSpotConnectForm } from "@/features/hubspot/components/HubSpotConnectForm";
import { disconnectHubSpot } from "@/features/hubspot/data/hubspot-api";

export function useHubSpotConnectCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useSessionStore((s) => s.user);
  const toast = useToast();
  const { hubspotStatus, status, error, fetchStatus, setHubSpotStatus } = useHubSpotStore();

  useEffect(() => {
    if (accessToken) fetchStatus(accessToken);
  }, [accessToken, fetchStatus]);

  function openConnectForm() {
    openModal(<HubSpotConnectForm />, "Conectar HubSpot");
  }

  async function disconnect() {
    if (!accessToken) return;
    try {
      await disconnectHubSpot(accessToken);
      setHubSpotStatus({ connected: false });
      toast("HubSpot desconectado.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível desconectar.");
    }
  }

  return {
    hubspotStatus,
    isLoading: status === "loading" || status === "idle",
    error,
    isAdmin: user?.role === "ADMIN",
    openConnectForm,
    disconnect,
  };
}
