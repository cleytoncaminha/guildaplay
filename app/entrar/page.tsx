import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Entrar | Dados da Guilda", description: "Entre na sua conta Dados da Guilda." };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) { const raw = (await searchParams).returnTo; const returnTo = Array.isArray(raw) ? raw[0] : raw; return <AuthShell eyebrow="Portal do aventureiro" title="Retome sua jornada." description="Suas coleções, avaliações e mesas estarão esperando por você."><LoginForm returnTo={returnTo} /></AuthShell>; }
