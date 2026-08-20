"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useNewSequenceForm } from "@/features/sequences/hooks/useNewSequenceForm";

export function NewSequenceForm() {
  const { create } = useNewSequenceForm();

  return (
    <>
      <Field label="Nome">
        <Input defaultValue="Nova cadência multicanal" />
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        No protótipo, WhatsApp e LinkedIn são ações manuais. O Dialer pode
        executar a fila de tentativas, respeitando a pausa por resposta.
      </div>
      <Button variant="primary" className="mt-3 w-full" onClick={create}>
        Criar cadência
      </Button>
    </>
  );
}
