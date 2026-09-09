"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useNewPersonForm } from "@/features/people/hooks/useNewPersonForm";

export function NewPersonForm() {
  const {
    accountOptions,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    accountId,
    setAccountId,
    role,
    setRole,
    phone,
    setPhone,
    email,
    setEmail,
    linkedinUrl,
    setLinkedinUrl,
    influenceLevel,
    setInfluenceLevel,
    submitting,
    canSubmit,
    create,
  } = useNewPersonForm();

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primeiro nome">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Sobrenome">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>
      <Field label="Job Title">
        <Input value={role} onChange={(e) => setRole(e.target.value)} />
      </Field>
      <Field label="Account">
        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accountOptions.length === 0 && <option value="">Nenhuma account cadastrada</option>}
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Telefone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="LinkedIn">
        <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
      </Field>
      <Field label="Nível de influência">
        <Select
          value={influenceLevel}
          onChange={(e) => setInfluenceLevel(e.target.value as typeof influenceLevel)}
        >
          <option value="">Não definido</option>
          <option value="FINANCIAL_DECISION_MAKER">Decisor financeiro</option>
          <option value="DIRECT_INFLUENCER">Influenciador direto</option>
          <option value="OPERATIONAL_DECISION_MAKER">Decisor operacional</option>
          <option value="INDIRECT_INFLUENCER">Influenciador indireto</option>
        </Select>
      </Field>
      <Button variant="primary" className="w-full" onClick={create} disabled={!canSubmit}>
        {submitting ? "Criando…" : "Criar prospect"}
      </Button>
    </>
  );
}
