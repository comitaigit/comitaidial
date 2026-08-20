"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, AuthApiError } from "@/features/auth/data/auth-api";
import { useSessionStore } from "@/features/shell/stores/session-store";

export function useLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setSession = useSessionStore((s) => s.setSession);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Informe email e senha.");
      return;
    }

    setSubmitting(true);
    try {
      const { user, accessToken } = await login(email, password);
      setSession(user, accessToken);
      router.push("/overview");
    } catch (err) {
      if (err instanceof AuthApiError) {
        // Backend already returns a generic, enumeration-safe message for
        // bad credentials — surface it as-is rather than guessing a nicer
        // one that might leak more detail.
        setError(
          err.status === 429
            ? "Muitas tentativas. Aguarde um minuto antes de tentar novamente."
            : err.message,
        );
      } else {
        setError("Não foi possível conectar ao servidor.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return {
    email,
    password,
    error,
    submitting,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
