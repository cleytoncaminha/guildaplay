import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Layers3, UserRound } from "lucide-react";
import { Breadcrumbs, CuratedItemGrid, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { CatalogApiError, getFeaturedList } from "@/lib/catalog-api";
import { formatDate } from "@/lib/formatters";

type FeaturedListPageProps = { params: Promise<{ slug: string }> };

async function loadList(slug: string) {
  try { return await getFeaturedList(slug); }
  catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: FeaturedListPageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await loadList(slug);
  return list ? {
    title: `${list.title} | Dados da Guilda`,
    description: list.description ?? `Explore a curadoria ${list.title}.`,
    alternates: { canonical: `/listas/${list.slug}` },
  } : { title: "Curadoria não encontrada | Dados da Guilda" };
}

export default async function FeaturedListPage({ params }: FeaturedListPageProps) {
  const { slug } = await params;
  const list = await loadList(slug);
  if (!list) notFound();

  return (
    <PublicShell active="community">
      <PageMasthead eyebrow="Curadoria temática" title={list.title} description={list.description}>
        <div className="masthead-facts"><span><UserRound /> Curadoria de {list.curator.name}</span><span><Layers3 /> {list.items.length} {list.items.length === 1 ? "título" : "títulos"}</span>{list.publishedAt && <span><CalendarDays /> Publicada em {formatDate(list.publishedAt)}</span>}</div>
      </PageMasthead>
      <div className="content-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Curadorias", href: "/listas" }, { label: list.title }]} />
        <header className="content-heading"><div><p className="panel-eyebrow">Seleção editorial</p><h2>Títulos desta curadoria</h2></div></header>
        <CuratedItemGrid items={list.items} />
      </div>
    </PublicShell>
  );
}
