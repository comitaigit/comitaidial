"use client";

import { Button } from "@/components/ui/Button";
import { useChangeListButton } from "@/features/dialer/hooks/useChangeListButton";

export function ChangeListButton() {
  const { changeList } = useChangeListButton();
  return <Button onClick={changeList}>Trocar lista</Button>;
}
