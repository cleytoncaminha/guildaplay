import type { Metadata } from "next";
import { CollectionsView } from "@/components/personal-catalog";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
export const metadata: Metadata = { title: "Minhas coleções | Dados da Guilda", robots: { index: false, follow: false } };
export default function CollectionsPage() { return <PublicShell><PageMasthead eyebrow="Estantes pessoais" title="Minhas coleções" description="Crie seleções privadas ou compartilhe seus títulos favoritos com a comunidade." /><div className="content-page account-page"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas coleções" }]} /><CollectionsView /></div></PublicShell>; }
