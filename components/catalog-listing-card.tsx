import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, Star } from "lucide-react";
import type { CatalogItem } from "./catalog-data";
import { coverUrl, typeLabels } from "./catalog-data";
import { formatRating } from "@/lib/formatters";

export function CatalogListingCard({ item }: { item: CatalogItem }) {
  const cover = coverUrl(item);
  const rating = formatRating(item.reviews.averageRating);

  return (
    <article className="catalog-list-card">
      <Link
        className={`catalog-list-card__cover ${cover ? "" : "catalog-cover--empty"}`}
        href={`/catalogo/${item.slug}`}
        style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
        aria-label={`Abrir ${item.title}`}
      >
        {!cover && <Compass aria-hidden="true" />}
        <span>{typeLabels[item.type]}</span>
      </Link>
      <div className="catalog-list-card__body">
        <div className="catalog-list-card__systems">
          {item.systems.length ? item.systems.map((system) => <span key={system.id}>{system.name}</span>) : <span>Sistema não informado</span>}
        </div>
        <h2><Link href={`/catalogo/${item.slug}`}>{item.title}</Link></h2>
        {(item.summary || item.description) && <p>{item.summary ?? item.description}</p>}
        <footer>
          <div>
            {item.originalReleaseYear && <span><CalendarDays />{item.originalReleaseYear}</span>}
            {rating && <span className="catalog-list-card__rating"><Star fill="currentColor" />{rating}/10</span>}
          </div>
          <Link href={`/catalogo/${item.slug}`} aria-label={`Ver detalhes de ${item.title}`}><ArrowRight /></Link>
        </footer>
      </div>
    </article>
  );
}
