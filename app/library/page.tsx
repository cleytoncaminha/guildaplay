import type { Metadata } from "next";
import { LibraryView } from "@/components/personal-catalog";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
export const metadata: Metadata = { title: "Minha biblioteca | Dados da Guilda", robots: { index: false, follow: false } };
export default function LibraryPage() { return <PublicShell><PageMasthead eyebrow="Seu acervo" title="Minha biblioteca" description="Combine marcadores, registre o que já jogou e mantenha suas anotações privadas." /><div className="content-page account-page"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minha biblioteca" }]} /><LibraryView /></div></PublicShell>; }
