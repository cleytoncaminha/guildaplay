import type { Metadata } from "next";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { ProfileForm } from "@/components/auth-forms";
export const metadata: Metadata = { title: "Minha conta | Dados da Guilda", robots: { index: false, follow: false } };
export default function ProfilePage() { return <PublicShell><PageMasthead eyebrow="Área do aventureiro" title="Minha conta" description="Mantenha seus dados atualizados e controle suas sessões." /><div className="content-page"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minha conta" }]} /><ProfileForm /></div></PublicShell>; }
