import type { Metadata } from "next";
import { ContributionsView } from "@/components/contributions";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Minhas contribuições | Dados da Guilda",
  robots: { index: false, follow: false },
};

export default function ContributionsPage() {
  return (
    <PublicShell>
      <PageMasthead eyebrow="Guilda colaborativa" title="Minhas contribuições" description="Acompanhe as sugestões editoriais que você enviou para o catálogo." />
      <div className="content-page account-page">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas contribuições" }]} />
        <ContributionsView />
      </div>
    </PublicShell>
  );
}

