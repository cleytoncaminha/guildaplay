import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/report-form";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
import { CatalogApiError, getCatalogItem } from "@/lib/catalog-api";

export const metadata: Metadata = {
  title: "Denunciar problema | Dados da Guilda",
  robots: { index: false, follow: false },
};

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ slug?: string | string[] }> }) {
  const rawSlug = (await searchParams).slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  if (!slug) notFound();

  let item;
  try {
    item = await getCatalogItem(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <PublicShell>
      <PageMasthead eyebrow="Cuidado comunitário" title="Denunciar um problema" description="Ajude a equipe a identificar informações incorretas, duplicidades ou conteúdo inadequado." />
      <div className="content-page account-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: item.title, href: `/catalog/${item.slug}` }, { label: "Denunciar problema" }]} />
        <ReportForm item={item} />
      </div>
    </PublicShell>
  );
}

