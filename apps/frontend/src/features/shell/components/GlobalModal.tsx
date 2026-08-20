"use client";

import { Button } from "@/components/ui/Button";
import { useGlobalModal } from "@/features/shell/hooks/useGlobalModal";

/**
 * Single mount point for the app's modal "base" (overlay, card, header, close
 * button). Feature code never renders its own overlay — it calls
 * `openModal(<Content />, "Title")` and only supplies the inner content.
 */
export function GlobalModal() {
  const { isOpen, title, content, closeModal, onOverlayClick } = useGlobalModal();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(16,19,24,0.45)] p-5"
      onClick={onOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? undefined}
        className="w-full max-w-140 overflow-hidden rounded-[13px] border border-line bg-panel"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <b>{title}</b>
          <Button size="small" onClick={closeModal}>
            Fechar
          </Button>
        </div>
        <div className="p-4">{content}</div>
      </div>
    </div>
  );
}
