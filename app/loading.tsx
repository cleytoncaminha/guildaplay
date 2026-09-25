import { PublicShell } from "@/components/public-shell";

export default function Loading() {
  return (
    <PublicShell>
      <div className="route-state route-loading" aria-live="polite" aria-busy="true">
        <div className="route-state__sigil" />
        <p>Consultando os arquivos da Guilda…</p>
        <span />
      </div>
    </PublicShell>
  );
}
