import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Layers3, UserRound } from "lucide-react";
import { Breadcrumbs, CuratedItemGrid, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { CatalogApiError, getPublicCollection } from "@/lib/catalog-api";
import { formatDate } from "@/lib/formatters";

type CollectionPageProps = { params: Promise<{ collectionId: string }> };

async function loadCollection(collectionId: string) {
  try { return await getPublicCollection(collectionId); }
  catch (error) {
    if (error instanceof CatalogApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { collectionId } = await params;
  const collection = await loadCollection(collectionId);
  return collection ? {
    title: `${collection.name} | Dados da Guilda`,
    description: collection.description ?? `Explore a coleção pública de ${collection.owner.name}.`,
  } : { title: "Coleção não encontrada | Dados da Guilda" };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collectionId } = await params;
  const collection = await loadCollection(collectionId);
  if (!collection || !collection.isPublic) notFound();

  return (
    <PublicShell active="community">
      <PageMasthead eyebrow="Coleção da comunidade" title={collection.name} description={collection.description}>
        <div className="masthead-facts"><span><UserRound /> Coleção de {collection.owner.name}</span><span><Layers3 /> {collection.items.length} {collection.items.length === 1 ? "título" : "títulos"}</span><span><CalendarDays /> Atualizada em {formatDate(collection.updatedAt)}</span></div>
      </PageMasthead>
      <div className="content-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Coleção pública" }, { label: collection.name }]} />
        <header className="content-heading"><div><p className="panel-eyebrow">Estante compartilhada</p><h2>Títulos desta coleção</h2></div></header>
        <CuratedItemGrid items={collection.items} />
      </div>
    </PublicShell>
  );
}
