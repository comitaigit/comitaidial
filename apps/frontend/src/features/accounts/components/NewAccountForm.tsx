"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useNewAccountForm } from "@/features/accounts/hooks/useNewAccountForm";

export function NewAccountForm() {
  const { create } = useNewAccountForm();

  return (
    <>
      <Field label="Nome da empresa">
        <Input placeholder="Ex.: Acme Brasil" />
      </Field>
      <Field label="Domínio">
        <Input placeholder="acme.com.br" />
      </Field>
      <Field label="Segmento">
        <Input placeholder="SaaS, Logística..." />
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        A Account nasce desde o dia 1 e centraliza o contexto público
        reutilizável entre seus prospects.
      </div>
      <Button variant="primary" className="mt-3 w-full" onClick={create}>
        Criar account
      </Button>
    </>
  );
}
