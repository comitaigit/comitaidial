"use client";

import { Field, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useEditCadenceCompanyForm } from "@/features/sequences/hooks/useEditCadenceCompanyForm";
import type { Cadence } from "@/features/sequences/data/cadences-api";

export function EditCadenceCompanyForm({ cadence }: { cadence: Cadence }) {
  const { clientCompanyId, setClientCompanyId, clientCompanies, submitting, submit } =
    useEditCadenceCompanyForm(cadence);

  return (
    <>
      <Field label="Empresa/produto">
        <Select value={clientCompanyId} onChange={(e) => setClientCompanyId(e.target.value)}>
          <option value="">Nenhuma (cadência fica incompleta)</option>
          {clientCompanies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} — {company.mainProduct}
            </option>
          ))}
        </Select>
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Sem uma empresa/produto selecionada, o Dialer não deixa discar esta cadência.
      </div>
      <Button variant="primary" className="mt-3 w-full" onClick={submit} disabled={submitting}>
        {submitting ? "Salvando…" : "Salvar"}
      </Button>
    </>
  );
}
