"use client";

import { Field, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useFindContactForm } from "@/features/accounts/hooks/useFindContactForm";
import type { Account } from "@/features/accounts/data/accounts-api";

export function FindContactForm({ account }: { account: Account }) {
  const { clientCompanies, clientCompanyId, setClientCompanyId, submitting, canSubmit, submit } =
    useFindContactForm(account);

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        Busca um contato em <b>{account.name}</b> que corresponda aos cargos-alvo (ICP)
        da empresa-cliente escolhida. Debita 1 crédito de enriquecimento se encontrar
        alguém novo.
      </p>
      <Field label="Empresa-cliente (define o ICP)">
        <Select value={clientCompanyId} onChange={(e) => setClientCompanyId(e.target.value)}>
          <option value="">Selecione…</option>
          {clientCompanies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>
      </Field>
      {clientCompanies.length === 0 && (
        <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
          Cadastre uma empresa-cliente com cargos-alvo em Workspace antes de buscar
          contatos.
        </div>
      )}
      <Button variant="primary" className="mt-3 w-full" onClick={submit} disabled={!canSubmit}>
        {submitting ? "Buscando…" : "Buscar contato"}
      </Button>
    </>
  );
}
