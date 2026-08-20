"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, AuthApiError } from "@/features/auth/data/auth-api";
import { useSessionStore } from "@/features/shell/stores/session-store";

export function useRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setSession = useSessionStore((s) => s.setSession);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    try {
      const { user, accessToken } = await register(name, email, password);
      setSession(user, accessToken);
      router.push("/overview");
    } catch (err) {
      if (err instanceof AuthApiError) {
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
    name,
    email,
    password,
    error,
    submitting,
    setName,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
