"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/features/auth/data/auth-api";
import { useSessionStore } from "@/features/shell/stores/session-store";

export function useTopbar() {
  const { user, accessToken, clearSession } = useSessionStore();
  const router = useRouter();

  async function handleLogout() {
    if (accessToken) {
      await logout(accessToken).catch(() => {
        // Best-effort: even if the network call fails, clear local state so
        // the UI doesn't strand the user in a stuck "logged in" screen.
      });
    }
    clearSession();
    router.replace("/login");
  }

  return { user, handleLogout };
}
