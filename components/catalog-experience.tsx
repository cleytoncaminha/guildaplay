"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, CalendarDays, ChevronDown, ChevronLeft,
  ChevronRight, Compass, Crown, Dices, Grid2X2, Heart, Library, Menu,
  RefreshCw, Search, Shield, Sparkles, Star, Users, WandSparkles, X,
} from "lucide-react";
import { Brand } from "./logo";
import { AuthStatus } from "./auth-status";
import {
  CatalogItem, CatalogResponse, CatalogSystem, coverUrl, typeLabels, typeOptions,
} from "./catalog-data";

type FiltersState = {
  query: string;
  systemId: string;
  type: string;
  languageCode: string;
  year: string;
  page: number;
};

const initialFilters: FiltersState = { query: "", systemId: "", type: "", languageCode: "", year: "", page: 1 };
const quickLinks = [
  { label: "Sistemas de RPG", icon: BookOpen, href: "/catalog" },
  { label: "Aventuras", icon: Dices, href: "/catalog?type=ADVENTURE" },
  { label: "Suplementos", icon: Library, href: "/catalog?type=SUPPLEMENT" },
  { label: "Cenários", icon: Crown, href: "/catalog?type=SETTING" },
  { label: "Curadorias", icon: Users, href: "/lists" },
  { label: "Comunidade", icon: Users, href: "/lists" },
  { label: "Todas as categorias", icon: Grid2X2, href: "/catalog" },
] as const;
const mainNavigation = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalog" },
  { label: "Sistemas", href: "/catalog" },
  { label: "Aventuras", href: "/catalog?type=ADVENTURE" },
  { label: "Suplementos", href: "/catalog?type=SUPPLEMENT" },
  { label: "Comunidade", href: "/lists" },
] as const;

function getInitialFilters(): FiltersState {
  if (typeof window === "undefined") return initialFilters;
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") ?? "",
    systemId: params.get("systemId") ?? "",
    type: params.get("type") ?? "",
    languageCode: params.get("languageCode") ?? "",
    year: params.get("year") ?? "",
    page: Number(params.get("page")) || 1,
  };
}

function Cover({ item, className = "" }: { item: CatalogItem; className?: string }) {
  const url = coverUrl(item);
  return <div className={`catalog-cover ${!url ? "catalog-cover--empty" : ""} ${className}`} style={url ? { backgroundImage: `url("${url}")` } : undefined} role="img" aria-label={url ? `Capa de ${item.title}` : "Item sem capa cadastrada"}>{!url && <Compass />}</div>;
}

function SectionTitle({ title, subtitle, link }: { title: string; subtitle: string; link?: string }) {
  return <div className="section-heading"><div className="section-heading__title"><Compass aria-hidden="true" /><div><h2>{title}</h2><p>{subtitle}</p></div></div>{link && <Link href="/catalog">{link} <ArrowRight size={16} /></Link>}</div>;
}

function Skeletons({ amount = 5, product = false }: { amount?: number; product?: boolean }) {
  return <div className={product ? "products-grid" : "systems-grid"}>{Array.from({ length: amount }, (_, index) => <div className={`skeleton ${product ? "skeleton--product" : ""}`} key={index}><i /><span /><span /><b /></div>)}</div>;
}

function Filters({ filters, systems, totalByType, onChange, onClear, loading }: {
  filters: FiltersState;
  systems: CatalogSystem[];
  totalByType: Map<string, number>;
  onChange: (patch: Partial<FiltersState>) => void;
  onClear: () => void;
  loading: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <button className="mobile-filter-button" onClick={() => setMobileOpen(true)}><Sparkles size={17} /> Filtros</button>
    <aside className={`filters ${mobileOpen ? "filters--open" : ""}`} aria-label="Filtros do catálogo">
      <div className="filters__mobile-head"><strong>Refine sua busca</strong><button onClick={() => setMobileOpen(false)} aria-label="Fechar filtros"><X /></button></div>
      <header><span><WandSparkles size={19} /> Filtros</span><button onClick={onClear}>Limpar tudo</button></header>
      <details open><summary>Tipo de conteúdo <ChevronDown size={14} /></summary><div className="filter-options">{typeOptions.map(({ value, label }) => <label key={value}><input type="checkbox" checked={filters.type === value} onChange={() => onChange({ type: filters.type === value ? "" : value, page: 1 })} /><span>{label}</span><small>({totalByType.get(value) ?? 0})</small></label>)}</div></details>
      <details open><summary>Sistema <ChevronDown size={14} /></summary><select aria-label="Sistema" value={filters.systemId} onChange={(event) => onChange({ systemId: event.target.value, page: 1 })}><option value="">Todos os sistemas</option>{systems.map((system) => <option value={system.id} key={system.id}>{system.name}</option>)}</select><div className="filter-options">{systems.slice(0, 5).map((system) => <label key={system.id}><input type="checkbox" checked={filters.systemId === system.id} onChange={() => onChange({ systemId: filters.systemId === system.id ? "" : system.id, page: 1 })} /><span>{system.name}</span></label>)}</div>{systems.length > 5 && <button className="more-button">Ver mais +</button>}</details>
      <details open><summary>Idioma <ChevronDown size={14} /></summary><select value={filters.languageCode} onChange={(event) => onChange({ languageCode: event.target.value, page: 1 })}><option value="">Todos os idiomas</option><option value="pt-BR">Português (Brasil)</option><option value="en">Inglês</option><option value="es">Espanhol</option></select></details>
      <details open><summary>Ano de publicação <ChevronDown size={14} /></summary><div className="year-fields"><input aria-label="Ano" placeholder="Ex.: 2024" inputMode="numeric" value={filters.year} onChange={(event) => onChange({ year: event.target.value.replace(/\D/g, "").slice(0, 4), page: 1 })} /></div></details>
      <details><summary>Nível de experiência <ChevronDown size={14} /></summary></details>
      <button className="apply-button" onClick={() => setMobileOpen(false)} disabled={loading}>{loading ? "Atualizando…" : "Aplicar filtros"}</button>
    </aside>
    {mobileOpen && <button className="filter-backdrop" onClick={() => setMobileOpen(false)} aria-label="Fechar filtros" />}
  </>;
}

function ProductCard({ item }: { item: CatalogItem }) {
  const system = item.systems[0]?.name ?? "Sistema não informado";
  const date = item.originalReleaseYear?.toString() ?? new Date(item.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  return <article className="product-card"><Cover item={item} className="product-card__cover" /><div className="product-card__body"><div className="product-card__topline"><span>{typeLabels[item.type]}</span><Link href={`/catalog/${item.slug}#personal-library`} aria-label="Organizar na minha estante"><Heart /></Link></div><h3>{item.title}</h3><h4>{system}</h4>{item.reviews.averageRating !== null && <div className="rating"><Star fill="currentColor" /> {(item.reviews.averageRating / 2).toFixed(1)} <span>({item.reviews.reviewCount})</span></div>}<p>{item.summary ?? item.description ?? "Conheça este título no catálogo da Guilda."}</p><footer><span><CalendarDays /> {date}</span><Link href={`/catalog/${item.slug}`} aria-label={`Abrir ${item.title}`}><ArrowRight /></Link></footer></div></article>;
}

function SystemCard({ system, items, isPopular }: { system: CatalogSystem; items: CatalogItem[]; isPopular: boolean }) {
  const representative = items.find((item) => item.systems.some((candidate) => candidate.id === system.id))!;
  const count = items.filter((item) => item.systems.some((candidate) => candidate.id === system.id)).length;
  return <article className="system-card"><Cover item={representative} className="system-card__art" />{isPopular && <span className="popular-badge"><Crown /> Em destaque</span>}<div><h3>{system.name}</h3><p>{representative.summary ?? `Explore os títulos de ${system.name} disponíveis no catálogo.`}</p><footer><span><Library /> {count} {count === 1 ? "produto" : "produtos"}</span><button onClick={() => document.dispatchEvent(new CustomEvent("select-system", { detail: system.id }))} aria-label={`Filtrar por ${system.name}`}><ArrowRight /></button></footer></div></article>;
}

export function CatalogExperience() {
  const [filters, setFilters] = useState<FiltersState>(getInitialFilters);
  const [queryInput, setQueryInput] = useState(() => getInitialFilters().query);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [discoveryItems, setDiscoveryItems] = useState<CatalogItem[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/catalog?limit=100&sort=NEWEST&order=DESC")
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<CatalogResponse>; })
      .then((result) => { if (active) setDiscoveryItems(result.data); })
      .catch(() => undefined)
      .finally(() => { if (active) setDiscoveryLoading(false); });
    return () => { active = false; };
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ limit: "10", sort: "NEWEST", order: "DESC", page: String(filters.page) });
    if (filters.query) params.set("q", filters.query);
    if (filters.systemId) params.set("systemId", filters.systemId);
    if (filters.type) params.set("type", filters.type);
    if (filters.languageCode) params.set("languageCode", filters.languageCode);
    if (filters.year.length === 4) params.set("year", filters.year);
    const publicParams = new URLSearchParams(params); publicParams.delete("limit"); publicParams.delete("sort"); publicParams.delete("order");
    window.history.replaceState(null, "", `${window.location.pathname}${publicParams.size ? `?${publicParams}` : ""}`);
    try {
      const response = await fetch(`/api/catalog?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível carregar o catálogo.");
      setCatalog(body);
    } catch (reason) { setCatalog(null); setError(reason instanceof Error ? reason.message : "Não foi possível carregar o catálogo."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);
  useEffect(() => { const listener = (event: Event) => setFilters((current) => ({ ...current, systemId: (event as CustomEvent<string>).detail, page: 1 })); document.addEventListener("select-system", listener); return () => document.removeEventListener("select-system", listener); }, []);

  const systems = useMemo(() => Array.from(new Map(discoveryItems.flatMap((item) => item.systems).map((system) => [system.id, system])).values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [discoveryItems]);
  const totalByType = useMemo(() => { const counts = new Map<string, number>(); discoveryItems.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1)); return counts; }, [discoveryItems]);
  const featuredSystems = useMemo(() => systems.map((system) => ({ system, count: discoveryItems.filter((item) => item.systems.some((candidate) => candidate.id === system.id)).length })).sort((a, b) => b.count - a.count).slice(0, 5).map(({ system }) => system), [systems, discoveryItems]);

  function submitSearch(event: FormEvent) { event.preventDefault(); setFilters((current) => ({ ...current, query: queryInput.trim(), page: 1 })); document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" }); }
  function clearFilters() { setFilters(initialFilters); setQueryInput(""); }
  const items = catalog?.data ?? [];

  return <main id="top">
    <header className="topbar"><Brand /><nav className={menuOpen ? "nav--open" : ""} aria-label="Navegação principal">{mainNavigation.map((item) => <Link key={item.label} className={item.label === "Início" ? "active" : ""} href={item.href}>{item.label}</Link>)}<AuthStatus mobile /></nav><div className="user-actions"><Link href="/catalog" aria-label="Pesquisar"><Search /></Link><AuthStatus /></div><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button></header>
    <section className="hero"><div className="hero__shade" /><div className="hero__content"><p className="eyebrow"><span /> O universo do RPG em um só lugar</p><h1>Sua próxima <em>aventura</em><br />começa aqui.</h1><p className="hero__copy">Descubra sistemas, aventuras, suplementos e muito mais.<br />Explore o universo do RPG e encontre histórias que combinam com você.</p><form className="searchbar" onSubmit={submitSearch}><Search aria-hidden="true" /><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Busque sistemas, aventuras, suplementos, cenários ou palavras-chave..." aria-label="Buscar no catálogo" /><select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))} aria-label="Categoria"><option value="">Todos</option>{typeOptions.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select><button><Search /> <span>Buscar</span></button></form><div className="quick-links">{quickLinks.map(({ label, icon: Icon, href }) => <a href={href} key={label}><Icon />{label}</a>)}</div></div><div className="hero__motto">Boas histórias<br />vivem aqui.</div></section>
    <div className="page-shell" id="catalogo"><Filters filters={filters} systems={systems} totalByType={totalByType} onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))} onClear={clearFilters} loading={loading} /><div className="catalog-content">
      <section><SectionTitle title="Sistemas em destaque" subtitle="Os sistemas com mais títulos publicados no catálogo." link="Ver todos os sistemas" />{discoveryLoading ? <Skeletons /> : featuredSystems.length ? <div className="systems-grid">{featuredSystems.map((system, index) => <SystemCard system={system} items={discoveryItems} isPopular={index === 0} key={system.id} />)}</div> : <div className="empty-inline">Ainda não há sistemas publicados.</div>}</section>
      <section><SectionTitle title={filters.query || filters.systemId || filters.type ? "Resultados do catálogo" : "Lançamentos recentes"} subtitle={catalog ? `${catalog.meta.total} ${catalog.meta.total === 1 ? "título encontrado" : "títulos encontrados"}.` : "Os lançamentos mais recentes do mundo do RPG."} />{loading ? <Skeletons product /> : error ? <div className="empty-state"><RefreshCw /><h3>O catálogo não respondeu</h3><p>{error}</p><button onClick={() => void loadCatalog()}>Tentar novamente</button></div> : items.length ? <div className="products-grid">{items.slice(0, 5).map((item) => <ProductCard item={item} key={item.id} />)}</div> : <div className="empty-state"><Dices /><h3>Nenhuma aventura encontrada</h3><p>Tente remover alguns filtros ou buscar por outro termo.</p><button onClick={clearFilters}>Limpar busca</button></div>}</section>
      {!loading && !error && items.length > 5 && <section><SectionTitle title="Continue explorando" subtitle="Mais conteúdos publicados que combinam com os filtros selecionados." /><div className="products-grid products-grid--compact">{items.slice(5, 10).map((item) => <ProductCard item={item} key={item.id} />)}</div></section>}
      {catalog && catalog.meta.totalPages > 1 && <nav className="pagination" aria-label="Paginação"><button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft /> Anterior</button><span>Página {catalog.meta.page} de {catalog.meta.totalPages}</span><button disabled={filters.page >= catalog.meta.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Próxima <ChevronRight /></button></nav>}
      <section className="category-strip"><div><Shield /><span><strong>Catálogo vivo e colaborativo</strong><small>Dados editoriais publicados e moderados pela comunidade da Guilda.</small></span></div><Link href="/lists">Ver curadorias <ArrowRight /></Link></section>
    </div></div>
    <footer className="footer"><Brand compact /><p>Feito para quem acredita que toda história merece ser descoberta.</p><span>© 2026 GuildaPlay</span></footer>
  </main>;
}
