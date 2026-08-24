"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useImportPeopleForm } from "@/features/people/hooks/useImportPeopleForm";

export function ImportPeopleForm() {
  const {
    file,
    setFile,
    cadenceOptions,
    cadenceId,
    setCadenceId,
    submitting,
    result,
    canSubmit,
    importCsv,
  } = useImportPeopleForm();

  return (
    <>
      <Field label="Arquivo CSV">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? <p className="mt-1 text-[11px] text-muted">{file.name}</p> : null}
      </Field>
      <Field label="Incluir em cadência (opcional)">
        <Select value={cadenceId} onChange={(e) => setCadenceId(e.target.value)}>
          <option value="">Não incluir</option>
          {cadenceOptions.map((cadence) => (
            <option key={cadence.id} value={cadence.id}>
              {cadence.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Colunas esperadas: <b>Prospect (Nome)</b>, <b>Nome da conta</b>,{" "}
        <b>Celular</b>, <b>LinkedIn (URL do perfil)</b>,{" "}
        <b>Nível de influência</b>. Uma account nova é criada automaticamente
        quando o nome não existe ainda; um prospect com o mesmo celular já
        cadastrado é atualizado, sem sobrescrever campos já preenchidos.
      </div>
      <Button
        variant="primary"
        className="mt-3 w-full"
        onClick={importCsv}
        disabled={!canSubmit}
      >
        {submitting ? "Importando…" : "Importar CSV"}
      </Button>

      {result ? (
        <div className="mt-3 rounded-[9px] border border-line bg-panel p-2.5 text-xs leading-relaxed">
          <p>
            <b>{result.created}</b> criados · <b>{result.merged}</b> atualizados ·{" "}
            <b>{result.skipped}</b> com erro
            {result.enrolledInCadence > 0 ? (
              <>
                {" "}
                · <b>{result.enrolledInCadence}</b> incluídos na cadência
              </>
            ) : null}
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-1.5 list-disc pl-4 text-bad">
              {result.errors.slice(0, 10).map((error) => (
                <li key={error}>{error}</li>
              ))}
              {result.errors.length > 10 ? (
                <li>… e mais {result.errors.length - 10} erro(s).</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
