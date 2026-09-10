"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useGmailStore } from "@/features/gmail/stores/gmail-store";
import {
  getGmailConnectUrl,
  disconnectGmail,
} from "@/features/gmail/data/gmail-api";

export function useGmailConnectCard() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { gmailStatus, status, error, fetchStatus, setGmailStatus } = useGmailStore();

  useEffect(() => {
    if (accessToken) fetchStatus(accessToken);
  }, [accessToken, fetchStatus]);

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (!gmailParam) return;
    if (gmailParam === "connected") toast("Gmail conectado com sucesso.");
    if (gmailParam === "error") toast("Não foi possível conectar o Gmail.");
    router.replace(pathname);
  }, [searchParams, toast, router, pathname]);

  async function connect() {
    if (!accessToken) return;
    try {
      const { url } = await getGmailConnectUrl(accessToken);
      window.location.href = url;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível iniciar a conexão.");
    }
  }

  async function disconnect() {
    if (!accessToken) return;
    try {
      await disconnectGmail(accessToken);
      setGmailStatus({ connected: false });
      toast("Gmail desconectado.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível desconectar.");
    }
  }

  return {
    gmailStatus,
    isLoading: status === "loading" || status === "idle",
    error,
    connect,
    disconnect,
  };
}
