import type { Metadata } from "next";
import { CollectionDetailView } from "@/components/personal-catalog";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
export const metadata: Metadata = { title: "Editar coleção | Dados da Guilda", robots: { index: false, follow: false } };
export default async function CollectionDetailPage({ params }: { params: Promise<{ collectionId: string }> }) { const { collectionId } = await params; return <PublicShell><PageMasthead eyebrow="Estante pessoal" title="Detalhes da coleção" description="Edite a visibilidade e organize os títulos que fazem parte desta seleção." /><div className="content-page account-page"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas coleções", href: "/my-collections" }, { label: "Detalhes" }]} /><CollectionDetailView collectionId={collectionId} /></div></PublicShell>; }
