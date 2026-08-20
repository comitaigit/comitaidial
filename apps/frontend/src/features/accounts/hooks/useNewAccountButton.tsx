"use client";

import { openModal } from "@/features/shell/stores/modal-store";
import { NewAccountForm } from "@/features/accounts/components/NewAccountForm";

export function useNewAccountButton() {
  function openNewAccountModal() {
    openModal(<NewAccountForm />, "Nova account");
  }

  return { openNewAccountModal };
}
