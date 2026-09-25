import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Brand } from "./logo";
import { AuthStatus } from "./auth-status";

const navigation = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Sistemas", href: "/catalogo" },
  { label: "Aventuras", href: "/catalogo?type=ADVENTURE" },
  { label: "Suplementos", href: "/catalogo?type=SUPPLEMENT" },
  { label: "Comunidade", href: "/listas" },
] as const;

export function PublicHeader({ active }: { active?: "home" | "catalog" | "community" }) {
  return (
    <header className="topbar public-topbar">
      <Brand />
      <nav aria-label="Navegação principal">
        {navigation.map((item, index) => (
          <Link
            className={
              (active === "home" && index === 0) ||
              (active === "catalog" && index === 1) ||
              (active === "community" && index === 5)
                ? "active"
                : undefined
            }
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="user-actions" aria-label="Ações da conta">
        <Link href="/catalogo" aria-label="Pesquisar no catálogo"><Search /></Link>
        <AuthStatus />
      </div>
      <details className="public-mobile-nav">
        <summary aria-label="Abrir menu"><Menu /></summary>
        <div>{navigation.map((item) => <Link href={item.href} key={item.label}>{item.label}</Link>)}<AuthStatus mobile /></div>
      </details>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="footer">
      <Brand compact />
      <p>Feito para quem acredita que toda mesa merece uma grande história.</p>
      <span>© 2026 GuildaPlay</span>
    </footer>
  );
}

export function PublicShell({ children, active }: { children: ReactNode; active?: "home" | "catalog" | "community" }) {
  return (
    <main id="top" className="public-page">
      <PublicHeader active={active} />
      {children}
      <PublicFooter />
    </main>
  );
}
