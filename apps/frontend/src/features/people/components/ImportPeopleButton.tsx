"use client";

import { Button } from "@/components/ui/Button";
import { useImportPeopleButton } from "@/features/people/hooks/useImportPeopleButton";

export function ImportPeopleButton() {
  const { openImportModal } = useImportPeopleButton();
  return <Button onClick={openImportModal}>Importar CSV</Button>;
}
