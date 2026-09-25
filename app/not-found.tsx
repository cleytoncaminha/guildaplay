import Link from "next/link";
import { Compass } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export default function NotFound() {
  return (
    <PublicShell>
      <section className="route-state">
        <Compass className="route-state__compass" />
        <p className="panel-eyebrow">Caminho não encontrado</p>
        <h1>Este pergaminho se perdeu.</h1>
        <p>O conteúdo pode não existir, estar privado ou ainda não ter sido publicado pela API.</p>
        <div className="detail-actions"><Link className="button-primary" href="/">Voltar ao início</Link><Link className="button-secondary" href="/catalogo">Explorar catálogo</Link></div>
      </section>
    </PublicShell>
  );
}
