"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { usePeopleStore } from "@/features/people/stores/people-store";

export function usePeoplePage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const { people, status, error, fetchPeople } = usePeopleStore();

  useEffect(() => {
    if (accessToken) fetchPeople(accessToken);
  }, [accessToken, fetchPeople]);

  return { people, isLoading: status === "loading" || status === "idle", error };
}
