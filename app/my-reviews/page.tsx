import type { Metadata } from "next";
import { ReviewsView } from "@/components/personal-catalog";
import { Breadcrumbs, PageMasthead } from "@/components/public-catalog-ui";
import { PublicShell } from "@/components/public-shell";
export const metadata: Metadata = { title: "Minhas avaliações | Dados da Guilda", robots: { index: false, follow: false } };
export default function MyReviewsPage() { return <PublicShell><PageMasthead eyebrow="Sua voz" title="Minhas avaliações" description="Acompanhe a moderação, edite suas impressões ou remova uma avaliação." /><div className="content-page account-page"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Minhas avaliações" }]} /><ReviewsView /></div></PublicShell>; }
