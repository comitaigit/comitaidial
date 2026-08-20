import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return (
    <AuthCard title="Comitai Dialer" subtitle="Crie sua conta para acessar o workspace.">
      <RegisterForm />
    </AuthCard>
  );
}
