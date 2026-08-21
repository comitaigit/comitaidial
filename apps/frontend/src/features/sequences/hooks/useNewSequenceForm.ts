"use client";

import { useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useCadencesStore } from "@/features/sequences/stores/cadences-store";
import { createCadence } from "@/features/sequences/data/cadences-api";

export function useNewSequenceForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const addCadence = useCadencesStore((s) => s.addCadence);

  const [name, setName] = useState("Nova cadência multicanal");
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!accessToken || !name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const cadence = await createCadence({ name: name.trim() }, accessToken);
      addCadence(cadence);
      toast("Cadência criada.");
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível criar a cadência.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    name,
    setName,
    submitting,
    canSubmit: name.trim().length > 0 && !submitting,
    create,
  };
}
