"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookCopy, BookOpen, BookOpenText, Boxes, Building2, ChevronRight, CircleUserRound, FolderTree, LayoutDashboard, LoaderCircle, LogOut, ShieldAlert, Tags, UsersRound } from "lucide-react";
import { Brand } from "@/components/logo";
import type { ApiEnvelope, AuthUser } from "@/lib/auth-types";

const navigation = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/catalog/systems", label: "Sistemas", icon: Boxes },
  { href: "/admin/catalog/items", label: "Itens", icon: BookOpen },
  { href: "/admin/catalog/editions", label: "Edições", icon: BookCopy },
  { href: "/admin/catalog/publishers", label: "Editoras", icon: Building2 },
  { href: "/admin/catalog/creators", label: "Criadores", icon: UsersRound },
  { href: "/admin/catalog/categories", label: "Categorias", icon: FolderTree },
  { href: "/admin/catalog/tags", label: "Tags", icon: Tags },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<ApiEnvelope<AuthUser | null>>;
      })
      .then((body) => {
        if (!body.data) {
          router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
          return;
        }
        setUser(body.data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUser(null);
      });
    return () => controller.abort();
  }, [pathname, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth-changed"));
    router.replace("/");
    router.refresh();
  }

  if (user === undefined) {
    return <main className="admin-gate"><LoaderCircle className="spin" /><p>Validando acesso administrativo…</p></main>;
  }

  if (!user?.roles.includes("ADMIN")) {
    return (
      <main className="admin-gate admin-gate--denied">
        <ShieldAlert />
        <p className="panel-eyebrow">Acesso restrito</p>
        <h1>Esta área é exclusiva da administração.</h1>
        <p>Sua sessão não possui a permissão ADMIN.</p>
        <Link className="admin-primary-button" href="/">Voltar ao catálogo</Link>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <aside className="admin-sidebar">
        <Brand compact />
        <div className="admin-sidebar__label"><ShieldAlert /> Administração</div>
        <nav aria-label="Navegação administrativa">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return <Link className={active ? "active" : undefined} href={href} key={href}><Icon /><span>{label}</span><ChevronRight /></Link>;
          })}
        </nav>
        <section className="admin-sidebar__roadmap" aria-label="Próximos módulos">
          <strong><BookOpenText /> CP5 editorial</strong>
          <span>Mídias e relações</span>
          <span>Edições</span>
          <span>Aliases, fontes e relações</span>
        </section>
        <div className="admin-sidebar__user">
          <CircleUserRound />
          <p><strong>{user.name}</strong><small>{user.email}</small></p>
          <button onClick={logout} aria-label="Sair"><LogOut /></button>
        </div>
      </aside>
      <section className="admin-workspace">{children}</section>
    </main>
  );
}
