"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useClientCompaniesCard } from "@/features/client-companies/hooks/useClientCompaniesCard";

export function ClientCompaniesCard() {
  const { clientCompanies, isLoading, error, openNewForm, openEditForm, remove } =
    useClientCompaniesCard();

  return (
    <Card>
      <CardHead>
        <CardTitle>Empresas & produtos</CardTitle>
        <Button size="small" variant="primary" onClick={openNewForm}>
          + Nova empresa
        </Button>
      </CardHead>
      <CardBody className="grid gap-2.5">
        {isLoading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : error ? (
          <p className="text-sm text-bad">{error}</p>
        ) : clientCompanies.length === 0 ? (
          <p className="text-xs text-muted">
            Nenhuma empresa/produto cadastrada ainda. Cada cadência do Dialer precisa de
            uma para os cards de pesquisa saberem o que está sendo vendido.
          </p>
        ) : (
          clientCompanies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between gap-2 rounded-[9px] border border-line bg-panel p-2.5"
            >
              <div>
                <b className="block text-[13px]">{company.name}</b>
                <span className="text-[11px] text-muted">{company.mainProduct}</span>
              </div>
              <div className="flex gap-1.5">
                <Button size="small" onClick={() => openEditForm(company)}>
                  Editar
                </Button>
                <Button size="small" variant="bad" onClick={() => remove(company)}>
                  Remover
                </Button>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
