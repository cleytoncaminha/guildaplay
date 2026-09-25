import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/auth-forms";
export const metadata: Metadata = { title: "Redefinir senha | Dados da Guilda" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) { const raw = (await searchParams).token; return <AuthShell eyebrow="Novo selo de acesso" title="Proteja novamente sua conta." description="Escolha uma nova senha para encerrar as sessões antigas e seguir em segurança."><ResetPasswordForm initialToken={Array.isArray(raw) ? raw[0] : raw} /></AuthShell>; }
