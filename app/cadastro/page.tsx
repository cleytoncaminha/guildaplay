import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";
export const metadata: Metadata = { title: "Criar conta | Dados da Guilda", description: "Crie sua conta na comunidade Dados da Guilda." };
export default function RegisterPage() { return <AuthShell eyebrow="Junte-se à Guilda" title="Toda grande história começa com um primeiro passo." description="Crie sua identidade, organize seu acervo e descubra novas aventuras."><RegisterForm /></AuthShell>; }
