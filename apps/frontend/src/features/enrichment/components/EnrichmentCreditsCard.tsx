"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useEnrichmentCreditsCard } from "@/features/enrichment/hooks/useEnrichmentCreditsCard";

const TOPUPS = [50, 100, 500];

export function EnrichmentCreditsCard() {
  const { balance, isLoading, error, isAdmin, granting, grant } = useEnrichmentCreditsCard();

  return (
    <Card>
      <CardHead>
        <CardTitle>Créditos de enriquecimento</CardTitle>
        {balance !== null && (
          <Tag variant={balance > 0 ? "ok" : "bad"}>{balance} créditos</Tag>
        )}
      </CardHead>
      <CardBody className="grid gap-2.5">
        {isLoading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : error ? (
          <p className="text-sm text-bad">{error}</p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Cada enriquecimento de prospect/account ou contato encontrado pela
              prospecção por IA que resulta em dado novo debita 1 crédito deste saldo
              compartilhado do workspace. Não há cobrança quando o provedor não
              encontra nada.
            </p>
            {isAdmin ? (
              <div className="flex flex-wrap gap-1.5">
                {TOPUPS.map((amount) => (
                  <Button
                    key={amount}
                    size="small"
                    disabled={granting}
                    onClick={() => grant(amount)}
                  >
                    + {amount}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted">
                Não há checkout ainda — peça a um administrador para adicionar
                créditos.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
