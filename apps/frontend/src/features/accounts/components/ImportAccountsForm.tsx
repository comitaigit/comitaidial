"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useImportAccountsForm } from "@/features/accounts/hooks/useImportAccountsForm";

export function ImportAccountsForm() {
  const { file, setFile, submitting, result, canSubmit, importCsv } =
    useImportAccountsForm();

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
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Colunas esperadas: <b>Nome da conta</b>, <b>Segmento</b>,{" "}
        <b>Prioridade</b> (Alta/Média/Baixa). Uma account com o mesmo nome já
        existente é atualizada — sem sobrescrever campos já preenchidos.
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
            <b>{result.created}</b> criadas · <b>{result.merged}</b> atualizadas ·{" "}
            <b>{result.skipped}</b> com erro
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
