import type { Metadata, Route } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, LibraryBig, Search, SlidersHorizontal } from "lucide-react";
import { CatalogListingCard } from "@/components/catalog-listing-card";
import { typeOptions, type CatalogItem } from "@/components/catalog-data";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { getCatalogItems, type CatalogListQuery } from "@/lib/catalog-api";

export const metadata: Metadata = {
  title: "Catálogo completo | Dados da Guilda",
  description: "Consulte todos os sistemas, aventuras, cenários, suplementos e ferramentas publicados.",
  alternates: { canonical: "/catalog" },
};

type RawSearchParams = Record<string, string | string[] | undefined>;
type CatalogPageProps = { searchParams: Promise<RawSearchParams> };

const itemTypes = new Set<CatalogItem["type"]>(typeOptions.map((option) => option.value));
const experienceLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const);
const sortOptions = {
  TITLE_ASC: { sort: "TITLE", order: "ASC" },
  RELEASE_YEAR_DESC: { sort: "RELEASE_YEAR", order: "DESC" },
  NEWEST_DESC: { sort: "NEWEST", order: "DESC" },
} as const satisfies Record<string, Pick<CatalogListQuery, "sort" | "order">>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(raw: RawSearchParams): CatalogListQuery {
  const type = first(raw.type);
  const experienceLevel = first(raw.experienceLevel);
  const selectedSort = first(raw.ordering) ?? "TITLE_ASC";
  const ordering = selectedSort in sortOptions ? selectedSort as keyof typeof sortOptions : "TITLE_ASC";
  const { sort, order } = sortOptions[ordering];
  const parsedYear = Number.parseInt(first(raw.year) ?? "", 10);

  return {
    q: first(raw.q)?.trim().slice(0, 120) || undefined,
    type: type && itemTypes.has(type as CatalogItem["type"]) ? type as CatalogItem["type"] : undefined,
    languageCode: first(raw.languageCode)?.slice(0, 10) || undefined,
    year: parsedYear >= 1900 && parsedYear <= 2200 ? parsedYear : undefined,
    experienceLevel: experienceLevel && experienceLevels.has(experienceLevel as "BEGINNER") ? experienceLevel as CatalogListQuery["experienceLevel"] : undefined,
    sort,
    order,
    page: Math.max(1, Number.parseInt(first(raw.page) ?? "1", 10) || 1),
    limit: 20,
  };
}

function pageHref(raw: RawSearchParams, page: number): Route {
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => {
    const current = first(value);
    if (current && key !== "page") params.set(key, current);
  });
  params.set("page", String(page));
  return `/catalog?${params.toString()}` as Route;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const raw = await searchParams;
  const query = parseQuery(raw);
  const catalog = await getCatalogItems(query);

  return (
    <PublicShell active="catalog">
      <PageMasthead eyebrow="Arquivo da Guilda" title="Catálogo completo" description="Todos os títulos publicados, em uma única estante para pesquisar, filtrar e explorar." />
      <div className="content-page catalog-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Catálogo" }]} />
        <form className="catalog-search" action="/catalog">
          <Search aria-hidden="true" />
          <input type="search" name="q" defaultValue={query.q} maxLength={120} placeholder="Busque por título, sistema ou palavra-chave…" aria-label="Buscar no catálogo" />
          <button type="submit"><Search /> Buscar</button>
        </form>

        <div className="catalog-list-layout">
          <aside className="catalog-filter-panel">
            <header><SlidersHorizontal /><div><span>Refine a busca</span><small>Filtros do catálogo</small></div></header>
            <form action="/catalog">
              {query.q && <input type="hidden" name="q" value={query.q} />}
              <label>Tipo de conteúdo<select name="type" defaultValue={query.type ?? ""}><option value="">Todos os tipos</option>{typeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
              <label>Idioma<select name="languageCode" defaultValue={query.languageCode ?? ""}><option value="">Todos os idiomas</option><option value="pt-BR">Português (Brasil)</option><option value="en">Inglês</option><option value="es">Espanhol</option></select></label>
              <label>Ano de publicação<input type="number" name="year" min="1900" max="2200" defaultValue={query.year} placeholder="Ex.: 2024" /></label>
              <label>Nível de experiência<select name="experienceLevel" defaultValue={query.experienceLevel ?? ""}><option value="">Todos os níveis</option><option value="BEGINNER">Iniciante</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option></select></label>
              <label>Ordenar por<select name="ordering" defaultValue={`${query.sort}_${query.order}`}><option value="TITLE_ASC">Título de A a Z</option><option value="NEWEST_DESC">Publicados recentemente</option><option value="RELEASE_YEAR_DESC">Ano de lançamento</option></select></label>
              <button className="button-primary" type="submit"><Filter /> Aplicar filtros</button>
              <Link href="/catalog">Limpar filtros</Link>
            </form>
          </aside>

          <section className="catalog-results" aria-labelledby="catalog-results-title">
            <header className="catalog-results__header"><div><p className="panel-eyebrow">Estante pública</p><h2 id="catalog-results-title">Todos os títulos</h2></div><span>{catalog.meta.total} {catalog.meta.total === 1 ? "resultado" : "resultados"}</span></header>
            {catalog.data.length ? <div className="catalog-list-grid">{catalog.data.map((item) => <CatalogListingCard item={item} key={item.id} />)}</div> : <div className="empty-state catalog-list-empty"><LibraryBig /><h2>Nenhum título encontrado</h2><p>A API não retornou títulos para os filtros selecionados.</p>{Object.keys(raw).length > 0 && <Link className="button-secondary" href="/catalog">Limpar filtros</Link>}</div>}
            {catalog.meta.totalPages > 1 && <nav className="pagination link-pagination" aria-label="Paginação do catálogo">{query.page! > 1 ? <Link href={pageHref(raw, query.page! - 1)}><ChevronLeft /> Anterior</Link> : <span /> }<span>Página {catalog.meta.page} de {catalog.meta.totalPages}</span>{query.page! < catalog.meta.totalPages ? <Link href={pageHref(raw, query.page! + 1)}>Próxima <ChevronRight /></Link> : <span />}</nav>}
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
