import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Compass, ScrollText, Sparkles, Users } from "lucide-react";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { getFeaturedLists } from "@/lib/catalog-api";
import { formatDate } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Curadorias | Dados da Guilda",
  description: "Explore seleções temáticas de sistemas, aventuras e suplementos de RPG.",
  alternates: { canonical: "/listas" },
};

type ListsPageProps = { searchParams: Promise<{ page?: string | string[] }> };

export default async function ListsPage({ searchParams }: ListsPageProps) {
  const query = await searchParams;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const lists = await getFeaturedLists(page, 12);

  return (
    <PublicShell active="community">
      <PageMasthead eyebrow="Escolhas da Guilda" title="Curadorias para sua próxima jornada" description="Coleções editoriais publicadas para ajudar você a encontrar novas histórias, sistemas e ferramentas." />
      <div className="content-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Curadorias" }]} />
        <header className="content-heading"><div><p className="panel-eyebrow">Explore por tema</p><h2>Listas publicadas</h2></div><span>{lists.meta.total} {lists.meta.total === 1 ? "curadoria" : "curadorias"}</span></header>
        {lists.data.length ? <div className="feature-list-grid">{lists.data.map((list, index) => <article className="feature-list-card" key={list.id}><div className="feature-list-card__ornament"><span>{String((page - 1) * lists.meta.limit + index + 1).padStart(2, "0")}</span>{index % 2 === 0 ? <Compass /> : <ScrollText />}</div><div className="feature-list-card__body"><div className="feature-list-card__meta"><span><Users /> Curadoria de {list.curator.name}</span>{list.publishedAt && <time dateTime={list.publishedAt}>{formatDate(list.publishedAt)}</time>}</div><h2>{list.title}</h2>{list.description && <p>{list.description}</p>}<footer><span>{list.items.length} {list.items.length === 1 ? "título" : "títulos"}</span><Link href={`/listas/${list.slug}`}>Explorar seleção <ChevronRight /></Link></footer></div></article>)}</div> : <div className="empty-state page-empty"><Sparkles /><h2>Novas curadorias estão sendo preparadas</h2><p>A API ainda não possui listas publicadas.</p><Link className="button-secondary" href="/catalogo">Explorar o catálogo</Link></div>}
        {lists.meta.totalPages > 1 && <nav className="pagination link-pagination" aria-label="Paginação das curadorias">{page > 1 ? <Link href={`?page=${page - 1}`}><ChevronLeft /> Anterior</Link> : <span /> }<span>Página {page} de {lists.meta.totalPages}</span>{page < lists.meta.totalPages ? <Link href={`?page=${page + 1}`}>Próxima <ChevronRight /></Link> : <span />}</nav>}
      </div>
    </PublicShell>
  );
}
