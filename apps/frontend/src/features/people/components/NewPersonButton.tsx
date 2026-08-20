"use client";

import { Button } from "@/components/ui/Button";
import { useNewPersonButton } from "@/features/people/hooks/useNewPersonButton";

export function NewPersonButton() {
  const { openNewPersonModal } = useNewPersonButton();
  return (
    <Button variant="primary" onClick={openNewPersonModal}>
      + Novo prospect
    </Button>
  );
}
