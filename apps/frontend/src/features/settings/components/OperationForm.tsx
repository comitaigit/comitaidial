"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useOperationForm } from "@/features/settings/hooks/useOperationForm";

export function OperationForm() {
  const { parallelism, setParallelism, save } = useOperationForm();

  return (
    <Card>
      <CardHead>
        <CardTitle>Operação</CardTitle>
      </CardHead>
      <CardBody>
        <Field label="Tenant">
          <Input defaultValue="comitai-internal" disabled />
        </Field>
        <Field label="Teto de paralelismo">
          <Select
            value={parallelism}
            onChange={(e) => setParallelism(e.target.value)}
          >
            <option>2 linhas</option>
            <option>3 linhas</option>
            <option>4 linhas</option>
            <option>5 linhas</option>
          </Select>
        </Field>
        <Field label="Horário comercial do tenant">
          <div className="grid grid-cols-2 gap-3">
            <Input defaultValue="08:30" />
            <Input defaultValue="18:00" />
          </div>
        </Field>
        <Field label="Fuso">
          <Select>
            <option>America/Sao_Paulo</option>
          </Select>
        </Field>
        <Button variant="primary" onClick={save}>
          Salvar alterações
        </Button>
      </CardBody>
    </Card>
  );
}
