"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useNewPersonForm } from "@/features/people/hooks/useNewPersonForm";

export function NewPersonForm() {
  const { create } = useNewPersonForm();

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primeiro nome">
          <Input />
        </Field>
        <Field label="Sobrenome">
          <Input />
        </Field>
      </div>
      <Field label="Account">
        <Select>
          <option>Grupo Atlas</option>
          <option>NovaLog</option>
          <option>FitPay</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Telefone">
          <Input />
        </Field>
        <Field label="E-mail">
          <Input />
        </Field>
      </div>
      <Field label="LinkedIn">
        <Input />
      </Field>
      <Button variant="primary" className="w-full" onClick={create}>
        Criar prospect
      </Button>
    </>
  );
}
