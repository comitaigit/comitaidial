"use client";

import { useEffect } from "react";
import { useModalStore } from "@/features/shell/stores/modal-store";

export function useGlobalModal() {
  const { isOpen, title, content, closeModal } = useModalStore();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeModal]);

  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeModal();
  }

  return { isOpen, title, content, closeModal, onOverlayClick };
}
