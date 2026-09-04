"use client";

import { Button } from "@/components/ui/Button";
import { useImportAccountsButton } from "@/features/accounts/hooks/useImportAccountsButton";

export function ImportAccountsButton() {
  const { openImportModal } = useImportAccountsButton();
  return <Button onClick={openImportModal}>Importar CSV</Button>;
}
