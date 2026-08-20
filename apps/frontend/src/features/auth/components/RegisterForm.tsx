"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useRegisterForm } from "@/features/auth/hooks/useRegisterForm";

export function RegisterForm() {
  const {
    name,
    email,
    password,
    error,
    submitting,
    setName,
    setEmail,
    setPassword,
    handleSubmit,
  } = useRegisterForm();

  return (
    <form onSubmit={handleSubmit} className="grid gap-1" noValidate>
      <Field label="Nome">
        <Input
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          required
        />
      </Field>
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mínimo 12 caracteres"
          required
        />
      </Field>
      <p className="mb-3 text-[11px] leading-relaxed text-muted">
        A senha precisa ter ao menos 12 caracteres, com letra maiúscula, minúscula e
        número.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-xs text-bad"
        >
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Entrar
        </Link>
      </p>
    </form>
  );
}
