"use client";

import { Button } from "@/components/ui/Button";
import { useNewSequenceButton } from "@/features/sequences/hooks/useNewSequenceButton";

export function NewSequenceButton() {
  const { openNewSequenceModal } = useNewSequenceButton();
  return (
    <Button variant="primary" onClick={openNewSequenceModal}>
      + Nova cadência
    </Button>
  );
}
