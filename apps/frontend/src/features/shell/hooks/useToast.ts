"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastFn = (message: string) => void;

export const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

/** Backing state + dispatcher for ToastProvider. Provider stays markup-only. */
export function useToastProviderState() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback<ToastFn>((msg) => {
    setMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), 2800);
  }, []);

  return { message, toast };
}
