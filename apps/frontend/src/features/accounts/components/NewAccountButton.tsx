"use client";

import { Button } from "@/components/ui/Button";
import { useNewAccountButton } from "@/features/accounts/hooks/useNewAccountButton";

export function NewAccountButton() {
  const { openNewAccountModal } = useNewAccountButton();
  return (
    <Button variant="primary" onClick={openNewAccountModal}>
      + Nova account
    </Button>
  );
}
