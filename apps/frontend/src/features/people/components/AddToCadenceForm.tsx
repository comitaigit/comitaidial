"use client";

import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { useAddToCadenceForm } from "@/features/people/hooks/useAddToCadenceForm";

export function AddToCadenceForm({
  personIds,
  onDone,
}: {
  personIds: string[];
  onDone: () => void;
}) {
  const { cadenceOptions, cadenceId, setCadenceId, submitting, canSubmit, submit } =
    useAddToCadenceForm(personIds, onDone);

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        {personIds.length} prospect{personIds.length > 1 ? "s" : ""} selecionado
        {personIds.length > 1 ? "s" : ""}
      </p>
      <Field label="Cadência">
        <Select value={cadenceId} onChange={(e) => setCadenceId(e.target.value)}>
          {cadenceOptions.length === 0 && <option value="">Nenhuma cadência cadastrada</option>}
          {cadenceOptions.map((cadence) => (
            <option key={cadence.id} value={cadence.id}>
              {cadence.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button variant="primary" className="w-full" onClick={submit} disabled={!canSubmit}>
        {submitting ? "Adicionando…" : "Adicionar à cadência"}
      </Button>
    </>
  );
}
