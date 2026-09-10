"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useGmailConnectCard } from "@/features/gmail/hooks/useGmailConnectCard";

export function GmailConnectCard() {
  const { gmailStatus, isLoading, error, connect, disconnect } = useGmailConnectCard();

  return (
    <Card>
      <CardHead>
        <CardTitle>AI Email (Gmail)</CardTitle>
        {gmailStatus?.connected ? (
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
        ) : gmailStatus?.connected ? (
          <>
            <p className="text-xs text-muted">
              E-mails de cadência com aprovação de IA são enviados via{" "}
              <b>{gmailStatus.email}</b>.
            </p>
            <Button variant="bad" size="small" onClick={disconnect} className="w-fit">
              Desconectar
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted">
              Conecte sua conta Gmail para que a Play Engine possa enviar e-mails
              redigidos por IA em nome deste BDR.
            </p>
            <Button variant="primary" size="small" onClick={connect} className="w-fit">
              Conectar Gmail
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
