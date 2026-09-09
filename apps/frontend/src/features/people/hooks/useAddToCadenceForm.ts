"use client";

import { useEffect, useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import {
  enrollPersonInCadence,
  listCadenceOptions,
  type CadenceOption,
} from "@/features/people/data/people-api";

export function useAddToCadenceForm(personIds: string[], onDone: () => void) {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);

  const [cadenceOptions, setCadenceOptions] = useState<CadenceOption[]>([]);
  const [cadenceId, setCadenceId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listCadenceOptions(accessToken)
      .then((options) => {
        setCadenceOptions(options);
        setCadenceId((current) => current || (options[0]?.id ?? ""));
      })
      .catch(() => {
        // Select just stays empty; canSubmit guards against submitting
        // without a cadence chosen.
      });
  }, [accessToken]);

  async function submit() {
    if (!accessToken || !cadenceId || submitting) return;

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        personIds.map((personId) => enrollPersonInCadence(cadenceId, personId, accessToken)),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      toast(
        failed === 0
          ? `${succeeded} prospect${succeeded > 1 ? "s" : ""} adicionado${succeeded > 1 ? "s" : ""} à cadência.`
          : `${succeeded} adicionado${succeeded !== 1 ? "s" : ""}, ${failed} não entraram (podem já estar na cadência).`,
      );
      onDone();
      closeModal();
    } finally {
      setSubmitting(false);
    }
  }

  return {
    cadenceOptions,
    cadenceId,
    setCadenceId,
    submitting,
    canSubmit: cadenceId.length > 0 && !submitting,
    submit,
  };
}
