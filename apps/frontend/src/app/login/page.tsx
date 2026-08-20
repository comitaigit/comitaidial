import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthCard title="Comitai Dialer" subtitle="Entre com sua conta do workspace.">
      <LoginForm />
    </AuthCard>
  );
}
