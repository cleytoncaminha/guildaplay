"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <PublicShell>
      <section className="route-state">
        <RefreshCw className="route-state__compass" />
        <p className="panel-eyebrow">A consulta foi interrompida</p>
        <h1>Não foi possível abrir este registro.</h1>
        <p>Tente novamente. Se o problema continuar, confira se a API está disponível.</p>
        <div className="detail-actions"><button className="button-primary" onClick={reset}>Tentar novamente</button><Link className="button-secondary" href="/">Voltar ao início</Link></div>
      </section>
    </PublicShell>
  );
}
