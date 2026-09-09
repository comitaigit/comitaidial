import { Field, Select } from "@/components/ui/Field";
import { Tag } from "@/components/ui/Tag";
import type { DialerCadence } from "@/features/dialer/data/dialer-api";

export function CadencePicker({
  cadences,
  isLoading,
  selectedCadenceId,
  onChange,
  isIncomplete,
}: {
  cadences: DialerCadence[];
  isLoading: boolean;
  selectedCadenceId: string | null;
  onChange: (cadenceId: string) => void;
  isIncomplete: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3.5">
      <Field label="Cadência">
        <Select
          value={selectedCadenceId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? "Carregando cadências…" : "Selecione uma cadência para discar"}
          </option>
          {cadences.map((cadence) => (
            <option key={cadence.id} value={cadence.id}>
              {cadence.name} ({cadence._count.enrollments} pessoas)
              {cadence.clientCompany ? ` — ${cadence.clientCompany.name}` : " — incompleta"}
            </option>
          ))}
        </Select>
      </Field>
      {isIncomplete ? (
        <Tag variant="warn">
          Esta cadência não tem empresa/produto configurada — defina em Cadências antes de
          discar.
        </Tag>
      ) : null}
    </div>
  );
}
