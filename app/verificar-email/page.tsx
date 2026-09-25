import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailForm } from "@/components/auth-forms";
export const metadata: Metadata = { title: "Verificar e-mail | Dados da Guilda" };
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const query = await searchParams; const value = (key: string) => Array.isArray(query[key]) ? query[key]?.[0] : query[key]; return <AuthShell eyebrow="Selo de autenticidade" title="Confirme sua identidade." description="A verificação protege sua conta e libera os recursos da comunidade."><VerifyEmailForm initialEmail={value("email")} initialToken={value("token")} registered={value("registered") === "1"} /></AuthShell>; }
