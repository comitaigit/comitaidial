"use client";

import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useClientCompanyForm } from "@/features/client-companies/hooks/useClientCompanyForm";
import type { ClientCompany } from "@/features/client-companies/data/client-companies-api";

export function ClientCompanyForm({ existing }: { existing?: ClientCompany }) {
  const {
    name,
    setName,
    mainProduct,
    setMainProduct,
    positioning,
    setPositioning,
    submitting,
    canSubmit,
    submit,
  } = useClientCompanyForm(existing);

  return (
    <>
      <Field label="Nome da empresa">
        <Input
          placeholder="Ex.: Humand"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Principal produto">
        <Input
          placeholder="Ex.: Plataforma de gestão de pessoas"
          value={mainProduct}
          onChange={(e) => setMainProduct(e.target.value)}
        />
      </Field>
      <Field label="Diferenciais / posicionamento (opcional)">
        <Textarea
          placeholder="O que ajuda a IA a montar um battlecard mais afiado."
          value={positioning}
          onChange={(e) => setPositioning(e.target.value)}
        />
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Esses dados alimentam os cards de pesquisa/battlecard do Dialer para
        toda cadência que representar esta empresa.
      </div>
      <Button
        variant="primary"
        className="mt-3 w-full"
        onClick={submit}
        disabled={!canSubmit}
      >
        {submitting ? "Salvando…" : existing ? "Salvar alterações" : "Cadastrar empresa"}
      </Button>
    </>
  );
}
