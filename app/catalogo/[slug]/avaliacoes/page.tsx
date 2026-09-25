import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, MessageSquareText, Star } from "lucide-react";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { CatalogApiError, getCatalogItem, getCatalogReviews } from "@/lib/catalog-api";
import { formatDate, formatRating } from "@/lib/formatters";

type ReviewsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

async function loadItem(slug: string) {
  try { return await getCatalogItem(slug); }
  catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: ReviewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);
  return item
    ? { title: `Avaliações de ${item.title} | Dados da Guilda`, description: `Leia as avaliações publicadas de ${item.title}.` }
    : { title: "Avaliações não encontradas | Dados da Guilda" };
}

export default async function ReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const item = await loadItem(slug);
  if (!item) notFound();

  const reviews = await getCatalogReviews(slug, page, 10);
  if (reviews.meta.totalPages > 0 && page > reviews.meta.totalPages) notFound();
  const rating = formatRating(reviews.summary.averageRating);

  return (
    <PublicShell active="community">
      <PageMasthead eyebrow="Vozes da comunidade" title={`Avaliações de ${item.title}`} description="Impressões publicadas por quem já explorou este universo.">
        <div className="masthead-rating">{rating ? <><Star fill="currentColor" /> <strong>{rating}</strong><span>de 10 · {reviews.summary.reviewCount} {reviews.summary.reviewCount === 1 ? "avaliação" : "avaliações"}</span></> : <span>Ainda sem avaliações publicadas.</span>}</div>
      </PageMasthead>
      <div className="content-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: item.title, href: `/catalogo/${item.slug}` }, { label: "Avaliações" }]} />
        <section className="review-list" aria-label="Avaliações publicadas">
          {reviews.data.length ? reviews.data.map((review) => <article className="review-card" key={review.id}><header><div className="review-avatar" aria-hidden="true">{review.author.name.charAt(0).toUpperCase()}</div><div><h2>{review.author.name}</h2><time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time></div><span><Star fill="currentColor" />{formatRating(review.rating)}/10</span></header>{review.content ? <p>{review.content}</p> : <p className="muted-copy">Esta avaliação foi publicada sem comentário.</p>}</article>) : <div className="empty-state page-empty"><MessageSquareText /><h2>A conversa ainda vai começar</h2><p>Não há avaliações publicadas para este título.</p><Link className="button-secondary" href={`/catalogo/${item.slug}`}>Voltar ao título</Link></div>}
        </section>
        {reviews.meta.totalPages > 1 && <nav className="pagination link-pagination" aria-label="Paginação das avaliações">{page > 1 ? <Link href={`?page=${page - 1}`}><ChevronLeft /> Anterior</Link> : <span /> }<span>Página {page} de {reviews.meta.totalPages}</span>{page < reviews.meta.totalPages ? <Link href={`?page=${page + 1}`}>Próxima <ChevronRight /></Link> : <span />}</nav>}
      </div>
    </PublicShell>
  );
}
