"use client";

import { Button } from "@/components/ui/Button";
import { useWithdrawInvitesButton } from "@/features/health/hooks/useWithdrawInvitesButton";

export function WithdrawInvitesButton() {
  const { done, withdraw } = useWithdrawInvitesButton();

  return (
    <Button size="small" disabled={done} onClick={withdraw}>
      {done ? "Retirada concluída" : "Executar retirada simulada"}
    </Button>
  );
}
