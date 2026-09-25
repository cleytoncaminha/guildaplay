import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/auth-forms";
export const metadata: Metadata = { title: "Recuperar senha | Dados da Guilda" };
export default function ForgotPasswordPage() { return <AuthShell eyebrow="Encontre o caminho" title="Uma chave pode ser refeita." description="Solicite um novo acesso sem perder seu acervo ou suas histórias."><ForgotPasswordForm /></AuthShell>; }
