"use client";

import { useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useAccountsStore } from "@/features/accounts/stores/accounts-store";
import {
  createAccount,
  type AccountPriority,
} from "@/features/accounts/data/accounts-api";

export function useNewAccountForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const addAccount = useAccountsStore((s) => s.addAccount);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [segment, setSegment] = useState("");
  const [priority, setPriority] = useState<AccountPriority | "">("");
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!accessToken || !name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const account = await createAccount(
        {
          name: name.trim(),
          domain: domain.trim() || undefined,
          segment: segment.trim() || undefined,
          priority: priority || undefined,
        },
        accessToken,
      );
      addAccount(account);
      toast("Account criada.");
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível criar a account.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    name,
    setName,
    domain,
    setDomain,
    segment,
    setSegment,
    priority,
    setPriority,
    submitting,
    canSubmit: name.trim().length > 0 && !submitting,
    create,
  };
}
