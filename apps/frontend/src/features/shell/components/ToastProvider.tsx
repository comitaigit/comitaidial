"use client";

import type { ReactNode } from "react";
import { ToastContext, useToastProviderState } from "@/features/shell/hooks/useToast";

export function ToastProvider({ children }: { children: ReactNode }) {
  const { message, toast } = useToastProviderState();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className={`fixed right-5.5 bottom-5.5 z-50 max-w-90 rounded-[10px] bg-dark px-3.5 py-3 text-xs text-white shadow-[0_10px_25px_rgba(0,0,0,0.18)] transition-opacity ${
          message ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
