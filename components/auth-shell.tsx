import type { ReactNode } from "react";
import { Compass, ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "./public-shell";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-art">
          <div className="auth-art__shade" />
          <div className="auth-art__content">
            <p className="eyebrow"><span />{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="auth-assurances"><span><ShieldCheck /> Sessão protegida</span><span><Sparkles /> Seu acervo em um só lugar</span></div>
          </div>
          <Compass className="auth-art__sigil" aria-hidden="true" />
        </div>
        <div className="auth-form-side">{children}</div>
      </section>
    </PublicShell>
  );
}
