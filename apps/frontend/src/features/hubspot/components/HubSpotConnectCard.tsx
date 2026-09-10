"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useHubSpotConnectCard } from "@/features/hubspot/hooks/useHubSpotConnectCard";

export function HubSpotConnectCard() {
  const { hubspotStatus, isLoading, error, isAdmin, openConnectForm, disconnect } =
    useHubSpotConnectCard();

  return (
    <Card>
      <CardHead>
        <CardTitle>HubSpot (CRM)</CardTitle>
        {hubspotStatus?.connected ? (
          <Tag variant="ok">Conectado</Tag>
        ) : (
          <Tag variant="default">Desconectado</Tag>
        )}
      </CardHead>
      <CardBody className="grid gap-2.5">
        {isLoading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : error ? (
          <p className="text-sm text-bad">{error}</p>
        ) : hubspotStatus?.connected ? (
          <>
            <p className="text-xs text-muted">
              Conexão de leitura ativa para todo o workspace — usada para mostrar
              dados de contacts/companies do HubSpot vinculados a prospects e
              accounts.
            </p>
            {isAdmin ? (
              <Button variant="bad" size="small" onClick={disconnect} className="w-fit">
                Desconectar
              </Button>
            ) : (
              <p className="text-[11px] text-muted">
                Somente um administrador pode desconectar o HubSpot.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-muted">
              Conecte o HubSpot (somente leitura) para ver contacts/companies
              vinculados diretamente nos prospects e accounts do Comitai.
            </p>
            {isAdmin ? (
              <Button variant="primary" size="small" onClick={openConnectForm} className="w-fit">
                Conectar HubSpot
              </Button>
            ) : (
              <p className="text-[11px] text-muted">
                Somente um administrador pode conectar o HubSpot.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
