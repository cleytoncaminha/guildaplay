import type { Metadata } from "next";
import { ContributionDetailView } from "@/components/contributions";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Detalhes da contribuição | Dados da Guilda",
  robots: { index: false, follow: false },
};

export default async function ContributionDetailPage({ params }: { params: Promise<{ contributionId: string }> }) {
  const { contributionId } = await params;
  return (
    <PublicShell>
      <PageMasthead eyebrow="Revisão comunitária" title="Detalhes da contribuição" description="Consulte os dados enviados e acompanhe o resultado da moderação." />
      <div className="content-page account-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas contribuições", href: "/contributions" }, { label: "Detalhes" }]} />
        <ContributionDetailView contributionId={contributionId} />
      </div>
    </PublicShell>
  );
}

