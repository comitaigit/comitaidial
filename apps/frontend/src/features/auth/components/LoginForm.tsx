"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";

export function LoginForm() {
  const { email, password, error, submitting, setEmail, setPassword, handleSubmit } =
    useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="grid gap-1" noValidate>
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          required
        />
      </Field>
      <Field label="Senha">
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
        />
      </Field>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-xs text-bad"
        >
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-semibold text-accent">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
