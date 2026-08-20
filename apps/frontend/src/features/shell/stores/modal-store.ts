import type { ReactNode } from "react";
import { create } from "zustand";

type ModalState = {
  isOpen: boolean;
  title: string | null;
  content: ReactNode | null;
  openModal: (content: ReactNode, title?: string) => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  title: null,
  content: null,
  openModal: (content, title) => set({ isOpen: true, content, title: title ?? null }),
  closeModal: () => set({ isOpen: false, content: null, title: null }),
}));

/**
 * Imperative helper so any component — server or client — can trigger the
 * global modal without wiring `useModalStore` by hand:
 *
 *   openModal(<NewAccountForm />, "Nova account")
 *
 * The component passed in is *only* the inner content; GlobalModal supplies
 * the overlay, header, title and close button.
 */
export function openModal(content: ReactNode, title?: string) {
  useModalStore.getState().openModal(content, title);
}

export function closeModal() {
  useModalStore.getState().closeModal();
}
