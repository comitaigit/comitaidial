"use client";

import { useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";

export function useWithdrawInvitesButton() {
  const [done, setDone] = useState(false);
  const toast = useToast();

  function withdraw() {
    setDone(true);
    toast("4 convites com mais de 10 dias retirados (simulação).");
  }

  return { done, withdraw };
}
