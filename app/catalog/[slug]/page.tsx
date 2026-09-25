import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Compass,
  ExternalLink,
  FilePenLine,
  Flag,
  Languages,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { coverUrl, typeLabels } from "@/components/catalog-data";
import { Breadcrumbs } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { ItemPersonalActions } from "@/components/personal-catalog";
import { CatalogApiError, getCatalogItem } from "@/lib/catalog-api";
import { formatRating } from "@/lib/formatters";

type CatalogItemPageProps = { params: Promise<{ slug: string }> };

async function loadItem(slug: string) {
  try {
    return await getCatalogItem(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: CatalogItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) return { title: "Título não encontrado | Dados da Guilda" };
  return {
    title: `${item.title} | Dados da Guilda`,
    description: item.summary ?? item.description ?? `Conheça ${item.title} no catálogo Dados da Guilda.`,
    alternates: { canonical: `/catalog/${item.slug}` },
  };
}

export default async function CatalogItemPage({ params }: CatalogItemPageProps) {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) notFound();

  const cover = coverUrl(item);
  const rating = formatRating(item.reviews.averageRating);
  const description = item.description ?? item.summary;

  return (
    <PublicShell active="catalog">
      <article className="detail-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Catálogo", href: "/catalog" }, { label: item.title }]} />
        <section className="detail-hero">
          <div
            className={`detail-cover ${cover ? "" : "catalog-cover--empty"}`}
            style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
            role="img"
            aria-label={cover ? `Capa de ${item.title}` : "Item sem capa cadastrada"}
          >
            {!cover && <Compass aria-hidden="true" />}
          </div>
          <div className="detail-hero__copy">
            <div className="detail-kicker"><span>{typeLabels[item.type]}</span>{item.systems.map((system) => <b key={system.id}>{system.name}</b>)}</div>
            <h1>{item.title}</h1>
            {item.summary && <p className="detail-summary">{item.summary}</p>}
            <div className="detail-facts">
              {item.originalReleaseYear && <span><CalendarDays />{item.originalReleaseYear}</span>}
              {rating && <span><Star fill="currentColor" />{rating}/10 · {item.reviews.reviewCount} {item.reviews.reviewCount === 1 ? "avaliação" : "avaliações"}</span>}
              {item.experienceLevel && <span><BookOpen />{item.experienceLevel}</span>}
            </div>
            <div className="detail-actions">
              <Link className="button-primary" href={`/catalog/${item.slug}/reviews`}>Ver avaliações <ArrowRight /></Link>
              <Link className="button-secondary" href={{ pathname: "/contributions/new", query: { itemId: item.id, title: item.title, slug: item.slug, type: item.type } }}><FilePenLine /> Sugerir correção</Link>
              <Link className="button-secondary" href={{ pathname: "/reports/new", query: { slug: item.slug } }}><Flag /> Denunciar problema</Link>
              <Link className="button-secondary" href="/catalog">Voltar ao catálogo</Link>
            </div>
          </div>
        </section>

        <ItemPersonalActions itemId={item.id} itemSlug={item.slug} />

        <div className="detail-layout">
          <div className="detail-main">
            <section className="paper-panel prose-panel">
              <p className="panel-eyebrow">Sobre este título</p>
              <h2>Uma porta para outro mundo</h2>
              {description ? <p>{description}</p> : <p className="muted-copy">Ainda não há uma descrição editorial publicada para este título.</p>}
            </section>

            {!!item.editions?.length && <section className="paper-panel"><div className="panel-heading"><BookOpen /><div><p className="panel-eyebrow">Publicações</p><h2>Edições</h2></div></div><div className="edition-list">{item.editions.map((edition) => <div key={edition.id}><strong>{edition.name}</strong><span><Languages /> {edition.languageCode}{edition.releaseYear ? ` · ${edition.releaseYear}` : ""}{edition.publisher ? ` · ${edition.publisher.name}` : ""}</span></div>)}</div></section>}

            {!!item.relations?.length && <section className="paper-panel"><div className="panel-heading"><Compass /><div><p className="panel-eyebrow">Continue explorando</p><h2>Títulos relacionados</h2></div></div><div className="relation-list">{item.relations.map((relation) => <Link href={`/catalog/${relation.item.slug}`} key={`${relation.type}-${relation.item.slug}`}><span>{relation.type}</span><strong>{relation.item.title}</strong><ArrowRight /></Link>)}</div></section>}
          </div>

          <aside className="detail-aside">
            <section className="paper-panel"><div className="panel-heading"><Users /><div><p className="panel-eyebrow">Créditos</p><h2>Criadores</h2></div></div>{item.creators?.length ? <ul className="plain-list">{item.creators.map((creator) => <li key={`${creator.id}-${creator.role}`}><strong>{creator.name}</strong><span>{creator.role}</span></li>)}</ul> : <p className="muted-copy">Créditos ainda não informados.</p>}</section>
            {!!(item.categories?.length || item.tags?.length) && <section className="paper-panel"><div className="panel-heading"><Tag /><div><p className="panel-eyebrow">Descoberta</p><h2>Temas e categorias</h2></div></div><div className="tag-cloud">{item.categories?.map((category) => <span key={category.id}>{category.name}</span>)}{item.tags?.map((tag) => <span key={tag.id}>{tag.name}</span>)}</div></section>}
            {!!item.sources?.length && <section className="paper-panel"><p className="panel-eyebrow">Referências</p><h2>Fontes</h2><ul className="source-list">{item.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink /></a></li>)}</ul></section>}
          </aside>
        </div>
      </article>
    </PublicShell>
  );
}
