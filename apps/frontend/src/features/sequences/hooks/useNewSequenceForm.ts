"use client";

import { useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { useCadencesStore } from "@/features/sequences/stores/cadences-store";
import {
  addCadenceStep,
  createCadence,
  type CadenceStepType,
  type CreateCadenceStepInput,
} from "@/features/sequences/data/cadences-api";

export function useNewSequenceForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const addCadence = useCadencesStore((s) => s.addCadence);

  const [name, setName] = useState("Nova cadência multicanal");
  const [steps, setSteps] = useState<CreateCadenceStepInput[]>([]);

  const [draftType, setDraftType] = useState<CadenceStepType>("CALL");
  const [draftDayOffset, setDraftDayOffset] = useState("0");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftWaitForAccept, setDraftWaitForAccept] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  function addDraftStep() {
    const dayOffset = Number(draftDayOffset);
    if (!Number.isInteger(dayOffset) || dayOffset < 0) return;

    setSteps((current) => [
      ...current,
      {
        type: draftType,
        dayOffset,
        notes: draftNotes.trim() || undefined,
        waitForConnectionAccepted:
          draftType === "LINKEDIN_CONNECTION_REQUEST" ? draftWaitForAccept : undefined,
      },
    ]);
    setDraftNotes("");
    setDraftWaitForAccept(false);
  }

  function removeDraftStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  async function create() {
    if (!accessToken || !name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const cadence = await createCadence({ name: name.trim() }, accessToken);
      for (const step of steps) {
        await addCadenceStep(cadence.id, step, accessToken);
      }
      addCadence({ ...cadence, _count: { steps: steps.length, enrollments: 0 } });
      toast(
        steps.length > 0
          ? `Cadência criada com ${steps.length} step${steps.length > 1 ? "s" : ""}.`
          : "Cadência criada.",
      );
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
    steps,
    draftType,
    setDraftType,
    draftDayOffset,
    setDraftDayOffset,
    draftNotes,
    setDraftNotes,
    draftWaitForAccept,
    setDraftWaitForAccept,
    addDraftStep,
    removeDraftStep,
    submitting,
    canSubmit: name.trim().length > 0 && !submitting,
    create,
  };
}
