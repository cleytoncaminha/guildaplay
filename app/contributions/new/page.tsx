import type { Metadata } from "next";
import { ContributionForm } from "@/components/contributions";
import type { CatalogItem } from "@/components/catalog-data";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Nova contribuição | Dados da Guilda",
  robots: { index: false, follow: false },
};

type NewContributionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const itemTypes = new Set<CatalogItem["type"]>(["CORE_BOOK", "SETTING", "ADVENTURE", "SUPPLEMENT", "TOOL"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewContributionPage({ searchParams }: NewContributionPageProps) {
  const query = await searchParams;
  const id = first(query.itemId);
  const title = first(query.title);
  const slug = first(query.slug);
  const type = first(query.type);
  const initialTarget = id && uuidPattern.test(id) && title && slug && type && itemTypes.has(type as CatalogItem["type"])
    ? { id, title: title.slice(0, 255), slug: slug.slice(0, 280), type: type as CatalogItem["type"] }
    : undefined;

  return (
    <PublicShell>
      <PageMasthead eyebrow="Conhecimento compartilhado" title="Contribua com o catálogo" description="Envie uma nova obra ou ajude a tornar uma página existente mais completa e precisa." />
      <div className="content-page account-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas contribuições", href: "/contributions" }, { label: "Nova sugestão" }]} />
        <ContributionForm initialTarget={initialTarget} />
      </div>
    </PublicShell>
  );
}

