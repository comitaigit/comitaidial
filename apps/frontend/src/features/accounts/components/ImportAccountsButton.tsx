"use client";

import { Button } from "@/components/ui/Button";
import { useImportAccountsButton } from "@/features/accounts/hooks/useImportAccountsButton";

export function ImportAccountsButton() {
  const { importAccounts } = useImportAccountsButton();
  return <Button onClick={importAccounts}>Importar CSV</Button>;
}
