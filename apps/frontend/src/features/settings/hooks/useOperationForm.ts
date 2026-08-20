"use client";

import { useState } from "react";
import { useToast } from "@/features/shell/hooks/useToast";

export function useOperationForm() {
  const [parallelism, setParallelism] = useState("3 linhas");
  const toast = useToast();

  function save() {
    toast("Configurações salvas (simulação).");
  }

  return { parallelism, setParallelism, save };
}
