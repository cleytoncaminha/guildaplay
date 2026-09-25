import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ScrollText } from "lucide-react";
import type { CuratedItem } from "./catalog-data";
import { typeLabels } from "./catalog-data";

export function PageMasthead({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="page-masthead">
      <div className="page-masthead__shade" />
      <div className="page-masthead__content">
        <p className="eyebrow"><span />{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Navegação estrutural">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && <i aria-hidden="true">/</i>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}

export function CuratedItemGrid({ items }: { items: CuratedItem[] }) {
  if (!items.length) return <div className="empty-inline">Nenhum título foi adicionado aqui.</div>;

  return (
    <div className="curated-grid">
      {items.map(({ item, position }) => (
        <article className="curated-card" key={item.id}>
          <div className="curated-card__number">{String(position).padStart(2, "0")}</div>
          <div className="curated-card__icon" aria-hidden="true">
            {item.type === "ADVENTURE" ? <ScrollText /> : item.type === "CORE_BOOK" ? <BookOpen /> : <Compass />}
          </div>
          <div><span>{typeLabels[item.type]}</span><h2>{item.title}</h2></div>
          <Link href={`/catalogo/${item.slug}`} aria-label={`Ver ${item.title}`}><ArrowRight /></Link>
        </article>
      ))}
    </div>
  );
}
