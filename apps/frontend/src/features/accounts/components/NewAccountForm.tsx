"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useNewAccountForm } from "@/features/accounts/hooks/useNewAccountForm";

export function NewAccountForm() {
  const {
    name,
    setName,
    domain,
    setDomain,
    segment,
    setSegment,
    priority,
    setPriority,
    submitting,
    canSubmit,
    create,
  } = useNewAccountForm();

  return (
    <>
      <Field label="Nome da empresa">
        <Input
          placeholder="Ex.: Acme Brasil"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Domínio">
        <Input
          placeholder="acme.com.br"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
      </Field>
      <Field label="Segmento">
        <Input
          placeholder="SaaS, Logística..."
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        />
      </Field>
      <Field label="Prioridade">
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
        >
          <option value="">Não definida</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </Select>
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        A Account nasce desde o dia 1 e centraliza o contexto público
        reutilizável entre seus prospects.
      </div>
      <Button
        variant="primary"
        className="mt-3 w-full"
        onClick={create}
        disabled={!canSubmit}
      >
        {submitting ? "Criando…" : "Criar account"}
      </Button>
    </>
  );
}
